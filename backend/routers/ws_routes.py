from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import cv2
import random
from state import sensor_sim, cv_engine, decision_engine, history_manager
import state as app_state

router = APIRouter(tags=["websockets"])

class ConnectionManager:
    def __init__(self):
        self.sensor_clients: list[WebSocket] = []
        self.video_clients: list[WebSocket] = []

    async def connect_sensor(self, websocket: WebSocket):
        await websocket.accept()
        self.sensor_clients.append(websocket)

    def disconnect_sensor(self, websocket: WebSocket):
        if websocket in self.sensor_clients:
            self.sensor_clients.remove(websocket)

    async def connect_video(self, websocket: WebSocket):
        await websocket.accept()
        self.video_clients.append(websocket)

    def disconnect_video(self, websocket: WebSocket):
        if websocket in self.video_clients:
            self.video_clients.remove(websocket)

manager = ConnectionManager()

@router.websocket("/ws/sensors")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect_sensor(websocket)
    try:
        while True:
            sensor_data = sensor_sim.update()
            sensor_anomalies = sensor_sim.check_anomalies()
            
            inspection_result = decision_engine.evaluate(
                vision_detections=app_state.latest_vision_detections,
                sensor_data=sensor_data,
                sensor_anomalies=sensor_anomalies
            )
            
            if inspection_result.status == "FAIL" or random.random() < 0.05:
                # Add record asynchronously
                await history_manager.add_record(inspection_result.dict())
            
            await websocket.send_json(inspection_result.dict())
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        manager.disconnect_sensor(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except:
            pass
        manager.disconnect_sensor(websocket)

@router.websocket("/ws/video")
async def websocket_endpoint_video(websocket: WebSocket):
    await manager.connect_video(websocket)
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Could not open webcam, using dummy frames")
    
    try:
        while True:
            if cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
            else:
                import numpy as np
                frame = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.randn(frame, 128, 32)
            
            jpeg_bytes, detections = cv_engine.process_frame(frame)
            
            app_state.latest_vision_detections = detections
            
            await websocket.send_bytes(jpeg_bytes)
            await asyncio.sleep(0.033)
    except WebSocketDisconnect:
        manager.disconnect_video(websocket)
    except Exception as e:
        print(f"Video WebSocket error: {e}")
        manager.disconnect_video(websocket)
    finally:
        if cap.isOpened():
            cap.release()
