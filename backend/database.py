import sqlite3
import json
import os

DB_NAME = "qc_data.db"

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create Profiles Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            good_criteria TEXT,
            thresholds TEXT -- JSON string
        )
    ''')

    # Create Defects Table (Linked to Profile)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS defects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            profile_id INTEGER,
            name TEXT NOT NULL,
            FOREIGN KEY (profile_id) REFERENCES profiles (id)
        )
    ''')

    # Create History Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp REAL,
            status TEXT,
            final_decision_reason TEXT,
            sensor_data TEXT, -- JSON string
            vision_defects TEXT -- JSON string
        )
    ''')

    # Create Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'operator'
        )
    ''')

    conn.commit()
    conn.close()

# Initialize on module load (or call explicitly)
if not os.path.exists(DB_NAME):
    init_db()
