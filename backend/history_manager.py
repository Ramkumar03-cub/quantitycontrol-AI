import json
import time
import csv
import io
from typing import List, Dict
from database import get_db_connection

class HistoryManager:
    def __init__(self):
        pass # DB is initialized in database.py

    def add_record(self, record: Dict):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if 'timestamp' not in record:
            record['timestamp'] = time.time()

        cursor.execute('''
            INSERT INTO history (timestamp, status, final_decision_reason, sensor_data, vision_defects)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            record['timestamp'],
            record['status'],
            record.get('final_decision_reason', ''),
            json.dumps(record.get('sensor_data', {})),
            json.dumps(record.get('vision_defects', []))
        ))
        
        conn.commit()
        conn.close()

    def get_history(self, limit=100):
        conn = get_db_connection()
        rows = conn.execute("SELECT * FROM history ORDER BY timestamp DESC LIMIT ?", (limit,)).fetchall()
        conn.close()
        
        history = []
        for row in rows:
            history.append({
                "id": row['id'],
                "timestamp": row['timestamp'],
                "status": row['status'],
                "final_decision_reason": row['final_decision_reason'],
                "sensor_data": json.loads(row['sensor_data']) if row['sensor_data'] else {},
                "vision_defects": json.loads(row['vision_defects']) if row['vision_defects'] else []
            })
        return history

    def export_csv(self):
        conn = get_db_connection()
        rows = conn.execute("SELECT * FROM history ORDER BY timestamp DESC").fetchall()
        conn.close()
        
        if not rows:
            return ""
        
        output = io.StringIO()
        # Define headers manually for cleaner CSV
        headers = ["id", "timestamp", "status", "reason", "temperature", "vibration", "pressure"]
        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()
        
        for row in rows:
            sensor_data = json.loads(row['sensor_data']) if row['sensor_data'] else {}
            writer.writerow({
                "id": row['id'],
                "timestamp": time.ctime(row['timestamp']),
                "status": row['status'],
                "reason": row['final_decision_reason'],
                "temperature": sensor_data.get('temperature', ''),
                "vibration": sensor_data.get('vibration', ''),
                "pressure": sensor_data.get('pressure', '')
            })
            
        return output.getvalue()
