import json
import os
import sqlite3
from database import init_db, get_db_connection

# Hardcoded profiles from dataset_manager.py
INITIAL_PROFILES = {
    "Generic": {
        "defects": ["Crack", "Dent", "Scratch"],
        "good_criteria": "No visible surface anomalies",
        "thresholds": {"confidence": 0.85}
    },
    "Soda Can": {
        "defects": ["Dent", "Scratch", "Crushed", "Label Missing", "Leaking"],
        "good_criteria": "Cylindrical shape intact, Label present",
        "thresholds": {"confidence": 0.90}
    },
    "PCB Board": {
        "defects": ["Missing Component", "Solder Bridge", "Burnt Trace", "Misaligned Chip"],
        "good_criteria": "All components present, Soldering clean",
        "thresholds": {"confidence": 0.95}
    },
    "Fabric Roll": {
        "defects": ["Tear", "Stain", "Weave Error", "Color Mismatch"],
        "good_criteria": "Uniform texture, Consistent color",
        "thresholds": {"confidence": 0.80}
    },
    "Glass Bottle": {
        "defects": ["Crack", "Chip", "Bubble", "Foreign Object"],
        "good_criteria": "Clear glass, No structural damage",
        "thresholds": {"confidence": 0.92}
    }
}

def migrate_profiles():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print("Migrating Profiles...")
    for name, data in INITIAL_PROFILES.items():
        # Check if exists
        cursor.execute("SELECT id FROM profiles WHERE name = ?", (name,))
        if cursor.fetchone():
            print(f"  - Skipping {name} (already exists)")
            continue

        # Insert Profile
        cursor.execute(
            "INSERT INTO profiles (name, good_criteria, thresholds) VALUES (?, ?, ?)",
            (name, data["good_criteria"], json.dumps(data["thresholds"]))
        )
        profile_id = cursor.lastrowid
        
        # Insert Defects
        for defect in data["defects"]:
            cursor.execute(
                "INSERT INTO defects (profile_id, name) VALUES (?, ?)",
                (profile_id, defect)
            )
        print(f"  + Imported {name}")

    conn.commit()
    conn.close()

def migrate_history():
    if not os.path.exists("history.json"):
        print("No history.json found to migrate.")
        return

    print("Migrating History...")
    try:
        with open("history.json", 'r') as f:
            history_data = json.load(f)
    except Exception as e:
        print(f"Error reading history.json: {e}")
        return

    conn = get_db_connection()
    cursor = conn.cursor()
    
    count = 0
    for item in history_data:
        # Check for duplicates (simple check by timestamp)
        cursor.execute("SELECT id FROM history WHERE timestamp = ?", (item.get('timestamp'),))
        if cursor.fetchone():
            continue

        cursor.execute('''
            INSERT INTO history (timestamp, status, final_decision_reason, sensor_data, vision_defects)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            item.get('timestamp'),
            item.get('status'),
            item.get('final_decision_reason'),
            json.dumps(item.get('sensor_data', {})),
            json.dumps(item.get('vision_defects', []))
        ))
        count += 1
    
    conn.commit()
    conn.close()
    print(f"  + Imported {count} history records.")

if __name__ == "__main__":
    init_db()
    migrate_profiles()
    migrate_history()
    print("Migration Complete!")
