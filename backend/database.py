import aiosqlite
import os
from contextlib import asynccontextmanager

DB_NAME = "qc_data.db"

@asynccontextmanager
async def get_db_connection():
    conn = await aiosqlite.connect(DB_NAME)
    conn.row_factory = aiosqlite.Row
    try:
        yield conn
    finally:
        await conn.close()

async def init_db():
    async with get_db_connection() as conn:
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                good_criteria TEXT,
                thresholds TEXT -- JSON string
            )
        ''')
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS defects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                profile_id INTEGER,
                name TEXT NOT NULL,
                FOREIGN KEY (profile_id) REFERENCES profiles (id)
            )
        ''')
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL,
                status TEXT,
                final_decision_reason TEXT,
                sensor_data TEXT, -- JSON string
                vision_defects TEXT -- JSON string
            )
        ''')
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'operator'
            )
        ''')
        await conn.commit()
