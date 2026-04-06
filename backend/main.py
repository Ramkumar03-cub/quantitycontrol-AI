from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db

# Routers
from routers import auth_routes, config_routes, dataset_routes, ai_routes, analytics_routes, ws_routes

# AI Training / State
import state as app_state
from database import get_db_connection
import json
import traceback

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup DB AI model prep
@app.on_event("startup")
async def startup_event():
    try:
        await init_db()
        await app_state.dataset_manager.initialize()
        print("Training Predictive Maintenance Model...")
        async with get_db_connection() as conn:
            async with conn.execute("SELECT * FROM history LIMIT 1000") as cursor:
                history_rows = await cursor.fetchall()
        history_data = [dict(row) for row in history_rows]
        
        for record in history_data:
            if record.get('sensor_data') and isinstance(record['sensor_data'], str):
                try:
                    record['sensor_data'] = json.loads(record['sensor_data'])
                except:
                    record['sensor_data'] = {}
                
        if app_state.ai_engine.train_model(history_data):
            print("Model trained successfully.")
        else:
            print("Model training failed (insufficient data).")
    except Exception as e:
        print(f"Startup training error: {e}")
        with open("startup_error.log", "w") as f:
            traceback.print_exc(file=f)

@app.get("/")
async def root():
    return {"message": "Manufacturing QC AI System API"}

app.include_router(auth_routes.router)
app.include_router(config_routes.router)
app.include_router(dataset_routes.router)
app.include_router(ai_routes.router)
app.include_router(analytics_routes.router)
app.include_router(ws_routes.router)
