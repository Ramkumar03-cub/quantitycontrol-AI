import asyncio
import traceback
import sys
sys.path.append("d:/projects/QC AI/backend")
from database import get_db_connection

async def test():
    try:
        async with get_db_connection() as conn:
            async with conn.execute("SELECT name FROM profiles") as cursor:
                res = await cursor.fetchall()
                print("Success:", res)
    except Exception as e:
        print(f"Error Occurred!")
        traceback.print_exc()

asyncio.run(test())
