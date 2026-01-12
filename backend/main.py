from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import cv2
import json
import time
from simulator import SensorSimulator
from cv_engine import CVEngine
from decision_engine import DecisionEngine
from ai_engine import AIEngine
from dataset_manager import DatasetManager
from history_manager import HistoryManager
from database import get_db_connection, init_db
import auth
import training_engine

# Initialize DB (ensure users table exists)
init_db()

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

# Train AI Model on Startup
try:
    print("Training Predictive Maintenance Model...")
    conn = get_db_connection()
    history_rows = conn.execute("SELECT * FROM history LIMIT 1000").fetchall()
    history_data = [dict(row) for row in history_rows]
    # Parse sensor_data from JSON if needed (assuming it's stored as JSON string in DB, 
    # but based on previous code it might be a separate table or column. 
    # Checking database.py would be good, but for now assuming history_manager handles it.
    # Actually, history table has sensor_data as JSON string.
    import json
    for record in history_data:
        if record.get('sensor_data') and isinstance(record['sensor_data'], str):
            try:
                record['sensor_data'] = json.loads(record['sensor_data'])
            except:
                record['sensor_data'] = {}
            
    if ai_engine.train_model(history_data):
        print("Model trained successfully.")
    else:
        print("Model training failed (insufficient data).")
    conn.close()
except Exception as e:
    print(f"Startup training error: {e}")
    with open("startup_error.log", "w") as f:
        import traceback
        traceback.print_exc(file=f)

# Store latest vision detections to combine with sensor data
latest_vision_detections = []

from pydantic import BaseModel

class UserAuth(BaseModel):
    username: str
    password: str

from fastapi.responses import JSONResponse

@app.post("/auth/register")
async def register(user: UserAuth):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if user exists
    existing = cursor.execute("SELECT 1 FROM users WHERE username = ?", (user.username,)).fetchone()
    if existing:
        conn.close()
        return JSONResponse(status_code=400, content={"error": "Username already taken"})
    
    hashed_pw = auth.get_password_hash(user.password)
    cursor.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (user.username, hashed_pw))
    conn.commit()
    conn.close()
    
    return {"message": "User registered successfully"}

@app.post("/auth/login")
async def login(user: UserAuth):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM users WHERE username = ?", (user.username,)).fetchone()
    conn.close()
    
    if not row or not auth.verify_password(user.password, row['password_hash']):
        return {"error": "Invalid credentials"}, 401
    
    token = auth.create_access_token({"sub": user.username, "role": row['role']})
    return {"access_token": token, "token_type": "bearer", "username": user.username}

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

@app.get("/analytics/stats")
async def get_analytics_stats():
    conn = get_db_connection()
    
    # 1. Total Inspections
    total = conn.execute("SELECT COUNT(*) FROM history").fetchone()[0]
    
    # 2. Pass/Fail Counts
    pass_count = conn.execute("SELECT COUNT(*) FROM history WHERE status = 'PASS'").fetchone()[0]
    fail_count = conn.execute("SELECT COUNT(*) FROM history WHERE status = 'FAIL'").fetchone()[0]
    
    # 3. Defect Distribution (Parse JSON)
    # SQLite JSON support might vary, so we'll fetch and process in Python for simplicity/compatibility
    rows = conn.execute("SELECT vision_defects FROM history WHERE status = 'FAIL'").fetchall()
    defect_counts = {}
    for row in rows:
        defects = json.loads(row[0]) if row[0] else []
        for d in defects:
            label = d.get('label') or d.get('type')
            if label:
                defect_counts[label] = defect_counts.get(label, 0) + 1
    
    # Format for Frontend Pie Chart
    defect_distribution = [
        {"name": k, "value": v} for k, v in defect_counts.items()
    ]
    
    # 4. Weekly Trend (Last 7 Days)
    # Group by date
    seven_days_ago = time.time() - (7 * 24 * 60 * 60)
    trend_rows = conn.execute(
        "SELECT timestamp, status FROM history WHERE timestamp > ?", 
        (seven_days_ago,)
    ).fetchall()
    
    daily_stats = {}
    for row in trend_rows:
        date_str = time.strftime("%Y-%m-%d", time.localtime(row[0]))
        if date_str not in daily_stats:
            daily_stats[date_str] = {"date": date_str, "total": 0, "pass": 0, "fail": 0}
        
        daily_stats[date_str]["total"] += 1
        if row[1] == 'PASS':
            daily_stats[date_str]["pass"] += 1
        else:
            daily_stats[date_str]["fail"] += 1
            
    weekly_trend = sorted(daily_stats.values(), key=lambda x: x['date'])
    
    conn.close()
    
    return {
        "kpi": {
            "total_inspections": total,
            "pass_rate": round((pass_count / total * 100), 1) if total > 0 else 0,
            "fail_count": fail_count
        },
        "defect_distribution": defect_distribution,
        "weekly_trend": weekly_trend
    }

@app.get("/ai/health")
async def get_system_health():
    # Get current sensor state without advancing simulation
    current_data = {
        "temperature": sensor_sim.temperature,
        "pressure": sensor_sim.pressure,
        "vibration": sensor_sim.vibration
    }
    return ai_engine.predict_maintenance(current_data)

@app.post("/feedback")
async def submit_feedback(feedback: dict):
    print(f"Received feedback: {feedback}")
    return {"status": "recorded", "message": "Feedback received and logged"}
    
    # 1. Stats
    total = conn.execute("SELECT COUNT(*) FROM history").fetchone()[0]
    pass_count = conn.execute("SELECT COUNT(*) FROM history WHERE status = 'PASS'").fetchone()[0]
    fail_count = conn.execute("SELECT COUNT(*) FROM history WHERE status = 'FAIL'").fetchone()[0]
    
    stats = {
        "kpi": {
            "total_inspections": total,
            "pass_rate": round((pass_count / total * 100), 1) if total > 0 else 0,
            "fail_count": fail_count
        }
    }
    
    # 2. Recent History
    history_rows = conn.execute("SELECT * FROM history ORDER BY timestamp DESC LIMIT 50").fetchall()
    recent_history = [dict(row) for row in history_rows]
    
    conn.close()
    
    pdf_buffer = generate_pdf_report(stats, recent_history)
    
    headers = {
        'Content-Disposition': 'attachment; filename="inspection_report.pdf"'
    }
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)

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

@app.post("/ai/train")
async def start_training(request: dict):
    try:
        profile_name = request.get("profile_name")
        epochs = request.get("epochs", 50)
        batch_size = request.get("batch_size", 32)
        
        if not profile_name:
            return JSONResponse(status_code=400, content={"error": "Profile name required"})
            
        print(f"Starting training for {profile_name}...")
        job_id = training_engine.start_training_job(profile_name, epochs, batch_size)
        return {"job_id": job_id, "message": "Training started"}
    except Exception as e:
        print(f"Training Error: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/ai/train/{job_id}")
async def get_training_status(job_id: str):
    status = training_engine.get_job_status(job_id)
    if not status:
        return JSONResponse(status_code=404, content={"error": "Job not found"})
    return status
