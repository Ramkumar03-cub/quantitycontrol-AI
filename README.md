# QC AI — Smart Factory Quality Control

> AI-powered manufacturing quality control system with real-time defect detection, predictive maintenance, and interactive model training.

**Tech Stack:** Python 3.10+ · FastAPI · React 18 · YOLOv8 (Ultralytics) · TailwindCSS 4 · SQLite (aiosqlite) · WebSockets · OpenCV · scikit-learn

---

## 🎯 Overview

**QC AI** is a full-stack, production-grade manufacturing quality control platform that combines **computer vision**, **sensor analytics**, and **predictive AI** into a unified control room dashboard. It is designed for factory floor operators, quality engineers, and maintenance teams.

### What Makes It Different

| Feature | Description |
|---------|-------------|
| 🎥 **Real-Time Vision AI** | Live webcam/video feed with YOLOv8 object detection overlays (bounding boxes, confidence scores, severity labels) |
| 📊 **Multi-Sensor Fusion** | WebSocket-streamed temperature, pressure, and vibration data with live charts |
| 🧠 **Predictive Maintenance** | AI reasoning engine with cross-sensor correlation, spectral pattern analysis, and historical failure matching |
| 🏋️ **Train Your Own Models** | 4-step wizard: Upload → Label (interactive bounding boxes) → Train (YOLOv8) → Deploy (hot-swap weights) |
| 📈 **Analytics Dashboard** | KPI cards, weekly inspection trends, defect distribution, shift/line performance, and root cause analysis |
| 📄 **PDF Reports** | One-click export of inspection history with executive summary tables |
| 🔐 **Authentication** | JWT-based login/register with protected routes |

---

## 🖥️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        REACT FRONTEND                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │Dashboard │ │AI Predict│ │Analytics │ │AI Train  │           │
│  │          │ │          │ │          │ │(Canvas)  │  + History │
│  │ VideoFeed│ │ Reasoning│ │ Charts   │ │ BBox     │  + Settings│
│  │ Sensors  │ │ Impact   │ │ KPIs     │ │ YOLO     │  + Login   │
│  └────┬─────┘ └──────────┘ └────┬─────┘ └────┬─────┘           │
│       │ WebSocket                │ REST        │ REST            │
└───────┼──────────────────────────┼─────────────┼────────────────┘
        │                          │             │
┌───────┴──────────────────────────┴─────────────┴────────────────┐
│                      FASTAPI BACKEND                            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐       │
│  │  WS Routes   │  │  AI Routes   │  │  Dataset Routes  │       │
│  │ /ws/video    │  │ /ai/train    │  │ /dataset/upload  │       │
│  │ /ws/sensors  │  │ /ai/health   │  │ /dataset/labels  │       │
│  └──────┬───────┘  │ /ai/analyze  │  │ /dataset/load    │       │
│         │          └──────┬───────┘  └────────┬─────────┘       │
│         │                 │                   │                  │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌───────┴──────────┐      │
│  │  CV Engine   │  │  AI Engine   │  │ Training Engine   │      │
│  │  (YOLOv8)    │  │  (sklearn)   │  │ (ultralytics)     │      │
│  └──────────────┘  └──────────────┘  └───────────────────┘      │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐      │
│  │  Simulator   │  │  Decision    │  │  History Manager   │      │
│  │  (sensors)   │  │  Engine      │  │  (aiosqlite)       │      │
│  └──────────────┘  └──────────────┘  └───────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   SQLite (async)   │
                    │   qc_data.db       │
                    └───────────────────┘
```

---

## 📁 Project Structure

```
QC AI/
├── backend/
│   ├── main.py                  # FastAPI app entry point & startup
│   ├── database.py              # Async SQLite (aiosqlite) connection manager
│   ├── state.py                 # Shared application state (singletons)
│   │
│   ├── routers/                 # Modular API route handlers
│   │   ├── auth_routes.py       #   JWT login & registration
│   │   ├── ai_routes.py         #   Training jobs, health check, analysis
│   │   ├── analytics_routes.py  #   KPIs, weekly trends, defect distribution
│   │   ├── config_routes.py     #   System configuration endpoints
│   │   ├── dataset_routes.py    #   Image upload, ZIP extract, labeling, model load
│   │   └── ws_routes.py         #   WebSocket streams (video + sensors)
│   │
│   ├── cv_engine.py             # Computer Vision: YOLOv8 inference + mock fallback
│   ├── ai_engine.py             # Predictive AI: Linear regression health scoring
│   ├── decision_engine.py       # Multi-modal fusion (vision + sensors → PASS/FAIL)
│   ├── training_engine.py       # YOLOv8 training pipeline with data.yaml generation
│   ├── dataset_manager.py       # Dataset CRUD, YOLO annotation file writer
│   ├── simulator.py             # Synthetic sensor data generator
│   ├── history_manager.py       # Inspection log persistence (async DB)
│   ├── report_generator.py      # PDF report generation (ReportLab)
│   ├── auth.py                  # Password hashing & JWT utilities
│   └── migrate.py               # Database schema migration tool
│
├── frontend/
│   ├── public/
│   │   └── logo.png             # Generated QC AI logo
│   ├── src/
│   │   ├── App.jsx              # Router + protected route wrapper
│   │   ├── main.jsx             # React DOM entry point
│   │   ├── index.css            # Design system (glassmorphism, glows, animations)
│   │   │
│   │   ├── components/
│   │   │   ├── Layout.jsx       # Sidebar navigation + glassmorphism shell
│   │   │   ├── Dashboard.jsx    # Control room: feeds, alerts, model selector
│   │   │   ├── VideoFeed.jsx    # WebSocket video stream + AI overlay + heatmap
│   │   │   ├── SensorChart.jsx  # Real-time line charts (temp, pressure, vibration)
│   │   │   └── AIAnalysisModal.jsx  # Root cause analysis popup
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx        # Auth screen with glassmorphism card
│   │   │   ├── Maintenance.jsx  # AI Predictive: health, reasoning engine, impact
│   │   │   ├── Analytics.jsx    # KPIs, charts, shift/line/operator analysis
│   │   │   ├── Training.jsx     # 4-step wizard: Upload → Label → Train → Deploy
│   │   │   ├── History.jsx      # Searchable inspection log with detail modals
│   │   │   └── Settings.jsx     # Threshold configuration & system toggles
│   │   │
│   │   └── services/
│   │       ├── aiService.js     # AI inference pub/sub (mock generator)
│   │       └── analyticsService.js  # Data transformation utilities
│   │
│   ├── index.html               # HTML entry with Inter font & favicon
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **pip** (Python package manager)

### 1. Clone & Backend Setup

```bash
git clone <repository-url>
cd "QC AI"

# Create Python virtual environment
cd backend
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/macOS)
# source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn[standard] aiosqlite websockets numpy opencv-python ultralytics scikit-learn pyyaml reportlab
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

### 3. Run the System

**Terminal 1 — Backend:**
```bash
cd backend
venv\Scripts\uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Open the App

Visit **[http://localhost:5173](http://localhost:5173)** → Register a new account → Start exploring!

---

## 📖 Feature Deep Dive

### 🎥 Dashboard — Real-Time Control Room

The main dashboard provides a unified view of the production line:

- **Live Video Feed** — WebSocket-streamed frames from a webcam (or generated dummy frames) with YOLOv8 bounding box overlays drawn in real-time
- **Defect Heatmap** — Toggle to a 20×20 grid heatmap that accumulates defect locations over time
- **Sensor Telemetry** — Three live-updating line charts (Temperature °C, Pressure PSI, Vibration mm/s)
- **Alert Feed** — Severity-coded alerts with confidence scores, timestamps, and one-click AI root cause analysis
- **Model Selector** — Hot-swap between trained YOLOv8 model profiles without restarting the server
- **Manual Upload** — Drag-and-drop image inspection with instant AI analysis

### 🧠 AI Predictive — Reasoning Engine

The predictive maintenance page generates rich, multi-category AI insights:

- **Vibration Analysis** — Trend calculations against ISO 10816 thresholds with percentage drift over 14 days
- **Thermal Analysis** — Spike counting, average temperature tracking, and lubrication correlation
- **Spectral Pattern Matching** — FFT-simulated harmonic frequency anomaly detection
- **Cross-Sensor Correlation** — Dual-threshold convergence detection with historical failure probability
- **Historical Pattern Matching** — Compares sensor trajectories against 1,247+ failure signatures
- **Business Impact** — Side-by-side planned vs. unplanned downtime cost comparison with estimated savings

### 🏋️ AI Training — End-to-End Pipeline

A 4-step wizard that takes you from raw images to a deployed model:

1. **Upload Data** — Drag-and-drop individual images (normal + defect) or upload a pre-structured ZIP dataset
2. **Label & Review** — Interactive HTML5 Canvas bounding box editor. Click and drag to draw defect regions; labels are auto-converted to YOLO format (class_id, x_center, y_center, width, height)
3. **Train Model** — Kicks off a real YOLOv8 training job with configurable epochs/batch size. Progress is polled in real-time with live logs. Training state persists across page navigation via `localStorage`
4. **Deploy** — Hot-swaps the trained `best.pt` weights into the live inference pipeline. The Dashboard immediately uses the new model

### 📊 Analytics

- **KPI Cards** — Total inspections, pass rate, failure count with glassmorphism glow effects
- **Weekly Trend** — Stacked bar chart (pass/fail) pulled from the SQLite database
- **Defect Distribution** — Donut chart with percentage breakdown by defect type
- **Operational Insights** — Defect rates by shift, production line, and operator risk analysis
- **Root Cause Analysis** — AI-ranked root causes with impact percentages and progress bars

### 📜 History

- **Searchable Table** — Full-text search across IDs, reasons, and status
- **Filters** — Status filter (ALL / PASS / FAIL) with pagination
- **Detail Modal** — Expandable view showing sensor readings, vision defects, and raw JSON
- **Export** — CSV download and PDF report generation via ReportLab

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create a new user account |
| `POST` | `/auth/login` | Get JWT access token |

### AI & Training
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/ai/health` | System health score & status |
| `POST` | `/ai/analyze` | Root cause analysis for a defect |
| `POST` | `/ai/train` | Start a YOLOv8 training job |
| `GET` | `/ai/train/{job_id}` | Poll training progress & logs |

### Dataset Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/dataset/create` | Create a new dataset profile |
| `POST` | `/dataset/upload` | Upload a single image |
| `POST` | `/dataset/upload_zip` | Upload a ZIP dataset |
| `POST` | `/dataset/labels` | Save YOLO bounding box annotations |
| `POST` | `/dataset/load` | Hot-swap active model weights |
| `GET` | `/dataset/profiles` | List available model profiles |

### Analytics & History
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/analytics/stats` | KPIs, trends, defect distribution |
| `GET` | `/history` | Inspection history records |
| `GET` | `/history/export` | Download history as CSV |
| `GET` | `/reports/generate` | Generate PDF inspection report |

### WebSocket Streams
| Endpoint | Description |
|----------|-------------|
| `ws://localhost:8000/ws/video` | Binary JPEG frame stream |
| `ws://localhost:8000/ws/sensors` | JSON sensor telemetry stream |

### Image Inspection
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/inspect/image` | Upload image for instant AI analysis |

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| **FastAPI** | Async REST API framework with auto-docs |
| **aiosqlite** | Non-blocking SQLite database access |
| **Ultralytics YOLOv8** | Object detection training & inference |
| **OpenCV** | Frame processing & video encoding |
| **scikit-learn** | Linear regression for health prediction |
| **WebSockets** | Real-time video & sensor streaming |
| **ReportLab** | PDF report generation |
| **PyYAML** | YOLO dataset configuration |

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** | Component-based UI framework |
| **Vite** | Lightning-fast dev server & bundler |
| **TailwindCSS 4** | Utility-first CSS with custom design tokens |
| **Recharts** | Responsive data visualization |
| **Lucide React** | Modern icon library |
| **HTML5 Canvas** | Interactive bounding box labeling |

---

## 🎨 Design System

The frontend uses a custom **glassmorphism** design system defined in `index.css`:

- **`glass-panel`** — Frosted glass effect with backdrop blur and subtle inner shadow
- **`glass-panel-hover`** — Animated hover with blue glow border and lift
- **`gradient-text`** — Animated blue → purple → pink gradient text
- **`card-glow-blue/green/red`** — Color-coded card border glows
- **`pulse-recording`** — Pulsing red dot for live recording indicator
- **`sidebar-link-active`** — Animated left border bar on active nav item
- **Custom scrollbar** — Thin translucent scrollbar matching the dark theme

---

## 📋 Environment Notes

| Setting | Default | Notes |
|---------|---------|-------|
| Backend Port | `8000` | Configurable via uvicorn CLI |
| Frontend Port | `5173` | Vite default |
| API Base URL | `http://localhost:8000` | Hardcoded in frontend (use `VITE_API_URL` for production) |
| Database | `backend/qc_data.db` | Auto-created on first startup |
| YOLO Base Model | `yolov8n.pt` | Auto-downloaded by ultralytics on first training run |
| Inference Device | `cpu` | Set to `cuda` in `cv_engine.py` for GPU acceleration |

---

## 📄 License

This project is for educational and demonstration purposes.

---

Built with ❤️ using FastAPI + React + YOLOv8
