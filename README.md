# Manufacturing Quality Control AI System

A real-time AI system for manufacturing quality control, featuring simulated sensor data, computer vision defect detection, and a reactive dashboard.

## Features
- **Real-time Dashboard**: Visualizes sensor data (Temperature, Pressure, Vibration) and video feed.
- **Simulated Sensors**: Generates realistic sensor readings with random fluctuations.
- **Computer Vision Simulation**: Simulates defect detection on a video feed (webcam or dummy frames).
- **Alert System**: Visual and log-based alerts when defects are detected.
- **WebSocket Streaming**: Low-latency data transmission from backend to frontend.

## Tech Stack
- **Backend**: Python, FastAPI, WebSockets, OpenCV, NumPy
- **Frontend**: React, Vite, TailwindCSS, Recharts, Lucide React

## Setup & Running

### Prerequisites
- Python 3.8+
- Node.js 16+

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
# source venv/bin/activate

pip install fastapi uvicorn websockets numpy opencv-python
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```

### 3. Running the System
Start the backend:
```bash
# In backend directory
venv\Scripts\uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Start the frontend:
```bash
# In frontend directory
npm run dev
```

Visit `http://localhost:5173` to view the dashboard.

cd backend
venv\Scripts\python -m uvicorn main:app --host 0.0.0.0 --port 8000

cd frontend
npm run dev
