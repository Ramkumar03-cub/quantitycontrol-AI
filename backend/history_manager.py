import json
import time
import csv
import io
from typing import List, Dict
from database import get_db_connection

class HistoryManager:
    def __init__(self):
        pass

    async def add_record(self, record: Dict):
        if 'timestamp' not in record:
            record['timestamp'] = time.time()

        async with get_db_connection() as conn:
            await conn.execute('''
                INSERT INTO history (timestamp, status, final_decision_reason, sensor_data, vision_defects)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                record['timestamp'],
                record['status'],
                record.get('final_decision_reason', ''),
                json.dumps(record.get('sensor_data', {})),
                json.dumps(record.get('vision_defects', []))
            ))
            await conn.commit()

    async def get_history(self, limit=100):
        async with get_db_connection() as conn:
            async with conn.execute("SELECT * FROM history ORDER BY timestamp DESC LIMIT ?", (limit,)) as cursor:
                rows = await cursor.fetchall()
        
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

    async def export_csv(self):
        async with get_db_connection() as conn:
            async with conn.execute("SELECT * FROM history ORDER BY timestamp DESC") as cursor:
                rows = await cursor.fetchall()
        
        if not rows:
            return ""
        
        output = io.StringIO()
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
