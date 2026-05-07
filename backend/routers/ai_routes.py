from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import cv2
import numpy as np
import base64
from state import cv_engine, ai_engine, history_manager, sensor_sim
import training_engine

router = APIRouter(tags=["ai"])

class AnalysisRequest(BaseModel):
    defect_type: str
    sensor_data: dict

@router.post("/inspect/image")
async def inspect_uploaded_image(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if frame is None:
        return JSONResponse(status_code=400, content={"error": "Invalid image"})

    jpeg_bytes, detections = cv_engine.process_frame(frame)
    
    is_defect = any(d.get("severity") != "pass" for d in detections)
    status = "FAIL" if is_defect else "PASS"
    
    if is_defect:
        defect_labels = list(set(
            d.get("label", "Unknown") for d in detections if d.get("severity") != "pass"
        ))
        reason = f"Detected: {', '.join(defect_labels)}"
    else:
        reason = "No defects identified — all regions passed quality checks"

    await history_manager.add_record({
        "status": status,
        "final_decision_reason": reason,
        "sensor_data": {},
        "vision_defects": detections
    })
    
    b64_image = base64.b64encode(jpeg_bytes).decode('utf-8')
    
    return {
        "detections": detections,
        "image": f"data:image/jpeg;base64,{b64_image}",
        "count": len(detections),
        "is_defect": is_defect
    }

@router.post("/ai/analyze")
async def analyze_defect(request: AnalysisRequest):
    return ai_engine.analyze_defect(request.defect_type, request.sensor_data)

@router.get("/ai/health")
async def get_system_health():
    current_data = {
        "temperature": sensor_sim.temperature,
        "pressure": sensor_sim.pressure,
        "vibration": sensor_sim.vibration
    }
    return ai_engine.predict_maintenance(current_data)

@router.post("/ai/train")
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
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.get("/ai/train/{job_id}")
async def get_training_status(job_id: str):
    status = training_engine.get_job_status(job_id)
    if not status:
        return JSONResponse(status_code=404, content={"error": "Job not found"})
    return status
