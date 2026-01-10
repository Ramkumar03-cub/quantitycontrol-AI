import sqlite3
import json
from ai_engine import AIEngine

def get_db_connection():
    conn = sqlite3.connect('qc_data.db')
    conn.row_factory = sqlite3.Row
    return conn

try:
    print("Initializing AI Engine...")
    ai_engine = AIEngine()
    
    print("Fetching history...")
    conn = get_db_connection()
    history_rows = conn.execute("SELECT * FROM history LIMIT 1000").fetchall()
    history_data = [dict(row) for row in history_rows]
    print(f"Fetched {len(history_data)} records.")
    
    print("Parsing sensor data...")
    for record in history_data:
        if isinstance(record['sensor_data'], str):
            record['sensor_data'] = json.loads(record['sensor_data'])
            
    print("Training model...")
    if ai_engine.train_model(history_data):
        print("Model trained successfully.")
    else:
        print("Model training failed.")
        
except Exception as e:
    print("CRASHED:")
    import traceback
    traceback.print_exc()
