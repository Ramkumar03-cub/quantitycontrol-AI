from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import cv2
import json
from simulator import SensorSimulator
from cv_engine import CVEngine
from decision_engine import DecisionEngine
from ai_engine import AIEngine
from dataset_manager import DatasetManager
from history_manager import HistoryManager

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sensor_sim = SensorSimulator()
cv_engine = CVEngine()
decision_engine = DecisionEngine()
ai_engine = AIEngine()
dataset_manager = DatasetManager()
history_manager = HistoryManager()

# Store latest vision detections to combine with sensor data
latest_vision_detections = []

from pydantic import BaseModel

class SystemConfig(BaseModel):
    defect_probability: float

class ProductConfig(BaseModel):
    name: str
    material: str

class DatasetConfig(BaseModel):
    profile_name: str

class AnalysisRequest(BaseModel):
    defect_type: str
    sensor_data: dict

@app.post("/config")
async def update_config(config: SystemConfig):
    sensor_sim.update_params(defect_prob=config.defect_probability)
    return {"message": "Configuration updated", "config": config}

@app.post("/config/product")
async def update_product(config: ProductConfig):
    # Legacy endpoint, now we prefer dataset profiles
    ai_engine.update_context(config.name, config.material)
    cv_engine.update_product_context(config.name, config.material)
    return {"message": f"Product context updated to {config.name} ({config.material})"}

@app.get("/dataset/profiles")
async def get_profiles():
    return {"profiles": dataset_manager.get_profiles()}

@app.post("/dataset/load")
async def load_dataset(config: DatasetConfig):
    profile = dataset_manager.load_profile(config.profile_name)
    # Update CV Engine with the specific defects from the dataset
    cv_engine.defect_types = profile["defects"]
    # Update AI Context as well
    ai_engine.update_context(config.profile_name, "Specific Material") 
    return {"message": f"Loaded dataset profile: {config.profile_name}", "profile": profile}

class NewDatasetConfig(BaseModel):
    name: str
    defects: list
    good_criteria: str

@app.post("/dataset/create")
async def create_dataset(config: NewDatasetConfig):
    dataset_manager.create_profile(config.name, config.defects, config.good_criteria)
    return {"message": f"Created new dataset profile: {config.name}"}

from fastapi import UploadFile, File, Form

@app.post("/dataset/upload")
async def upload_training_images(
    file: UploadFile = File(...),
    profile_name: str = Form(...),
    category: str = Form(...)
):
    contents = await file.read()
    success, message = dataset_manager.save_image(profile_name, category, contents, file.filename)
    
    if success:
        return {"message": f"Successfully uploaded {file.filename}", "path": message}
    else:
        return {"error": message}, 400

import base64
import numpy as np

@app.post("/inspect/image")
async def inspect_uploaded_image(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if frame is None:
        return {"error": "Invalid image"}, 400

    # Process using the same engine as video feed
    jpeg_bytes, detections = cv_engine.process_frame(frame)
    
    # Encode to base64 for frontend display
    b64_image = base64.b64encode(jpeg_bytes).decode('utf-8')
    
    return {
        "detections": detections,
        "image": f"data:image/jpeg;base64,{b64_image}",
        "count": len(detections)
    }

@app.post("/ai/analyze")
async def analyze_defect(request: AnalysisRequest):
    result = ai_engine.analyze_defect(request.defect_type, request.sensor_data)
    return result

@app.get("/ai/health")
async def get_system_health():
    return ai_engine.predict_maintenance([])

@app.post("/feedback")
async def submit_feedback(feedback: dict):
    print(f"Received feedback: {feedback}")
    return {"status": "recorded", "message": "Feedback received and logged"}

@app.get("/history")
async def get_history():
    return history_manager.get_history()

from fastapi.responses import PlainTextResponse
@app.get("/history/export")
async def export_history():
    csv_content = history_manager.export_csv()
    return PlainTextResponse(csv_content, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=inspection_history.csv"})

@app.get("/")
async def root():
    return {"message": "Manufacturing QC AI System API"}

@app.websocket("/ws/sensors")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Get latest sensor data
            sensor_data = sensor_sim.update()
            sensor_anomalies = sensor_sim.check_anomalies()
            
            # Step 5: Multi-Modal Decision Making
            inspection_result = decision_engine.evaluate(
                vision_detections=latest_vision_detections,
                sensor_data=sensor_data,
                sensor_anomalies=sensor_anomalies
            )
            
            # Save to history if there is a defect or periodically (e.g. every 100th frame)
            # For demo purposes, we save if status is FAIL or randomly to populate history
            import random
            if inspection_result.status == "FAIL" or random.random() < 0.05:
                history_manager.add_record(inspection_result.dict())
            
            await websocket.send_json(inspection_result.dict())
            await asyncio.sleep(0.1) # 10Hz update rate
    except WebSocketDisconnect:
        print("Sensor client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except:
            pass

@app.websocket("/ws/video")
async def websocket_endpoint_video(websocket: WebSocket):
    await websocket.accept()
    cap = cv2.VideoCapture(0) # Try to open webcam
    
    if not cap.isOpened():
        print("Could not open webcam, using dummy frames")
    
    try:
        while True:
            if cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
            else:
                # Generate dummy frame
                import numpy as np
                frame = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.randn(frame, 128, 32)
            
            # Process frame
            jpeg_bytes, detections = cv_engine.process_frame(frame)
            
            # Update global state for decision engine
            global latest_vision_detections
            latest_vision_detections = detections
            
            # Send frame over websocket (binary)
            await websocket.send_bytes(jpeg_bytes)
            
            await asyncio.sleep(0.033) # ~30 FPS
    except WebSocketDisconnect:
        print("Video client disconnected")
    except Exception as e:
        print(f"Video WebSocket error: {e}")
    finally:
        if cap.isOpened():
            cap.release()
