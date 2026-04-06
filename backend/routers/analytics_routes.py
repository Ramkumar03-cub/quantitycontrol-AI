from fastapi import APIRouter
from fastapi.responses import JSONResponse, StreamingResponse, PlainTextResponse
from database import get_db_connection
from state import history_manager
from report_generator import generate_pdf_report
import time
import json

router = APIRouter(tags=["analytics"])

@router.get("/analytics/stats")
async def get_analytics_stats():
    async with get_db_connection() as conn:
        async with conn.execute("SELECT COUNT(*) FROM history") as cursor:
            row = await cursor.fetchone()
            total = row[0] if row else 0
            
        async with conn.execute("SELECT COUNT(*) FROM history WHERE status = 'PASS'") as cursor:
            row = await cursor.fetchone()
            pass_count = row[0] if row else 0
            
        async with conn.execute("SELECT COUNT(*) FROM history WHERE status = 'FAIL'") as cursor:
            row = await cursor.fetchone()
            fail_count = row[0] if row else 0
        
        async with conn.execute("SELECT vision_defects FROM history WHERE status = 'FAIL'") as cursor:
            rows = await cursor.fetchall()
            
        defect_counts = {}
        for row in rows:
            defects = json.loads(row[0]) if row[0] else []
            for d in defects:
                label = d.get('label') or d.get('type')
                if label:
                    defect_counts[label] = defect_counts.get(label, 0) + 1
        
        defect_distribution = [{"name": k, "value": v} for k, v in defect_counts.items()]
        
        seven_days_ago = time.time() - (7 * 24 * 60 * 60)
        async with conn.execute(
            "SELECT timestamp, status FROM history WHERE timestamp > ?", 
            (seven_days_ago,)
        ) as cursor:
            trend_rows = await cursor.fetchall()
        
    daily_stats = {}
    for row in trend_rows:
        date_str = time.strftime("%Y-%m-%d", time.localtime(row[0]))
        if date_str not in daily_stats:
            daily_stats[date_str] = {"date": date_str, "total": 0, "pass": 0, "fail": 0}
        
        daily_stats[date_str]["total"] += 1
        if row[1] == 'PASS':
            daily_stats[date_str]["pass"] += 1
        else:
            daily_stats[date_str]["fail"] += 1
            
    weekly_trend = sorted(daily_stats.values(), key=lambda x: x['date'])
    
    return {
        "kpi": {
            "total_inspections": total,
            "pass_rate": round((pass_count / total * 100), 1) if total > 0 else 0,
            "fail_count": fail_count
        },
        "defect_distribution": defect_distribution,
        "weekly_trend": weekly_trend
    }

@router.post("/feedback")
async def submit_feedback(feedback: dict):
    print(f"Received feedback: {feedback}")
    return {"status": "recorded", "message": "Feedback received and logged"}

@router.get("/history/export")
async def export_history():
    csv_content = await history_manager.export_csv()
    return PlainTextResponse(csv_content, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=inspection_history.csv"})

@router.get("/history")
async def get_history(limit: int = 100):
    try:
        data = await history_manager.get_history(limit=limit)
        return data
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.get("/analytics/report")
async def generate_report():
    async with get_db_connection() as conn:
        async with conn.execute("SELECT COUNT(*) FROM history") as cursor:
            row = await cursor.fetchone()
            total = row[0] if row else 0
            
        async with conn.execute("SELECT COUNT(*) FROM history WHERE status = 'PASS'") as cursor:
            row = await cursor.fetchone()
            pass_count = row[0] if row else 0
            
        async with conn.execute("SELECT COUNT(*) FROM history WHERE status = 'FAIL'") as cursor:
            row = await cursor.fetchone()
            fail_count = row[0] if row else 0
            
        stats = {
            "kpi": {
                "total_inspections": total,
                "pass_rate": round((pass_count / total * 100), 1) if total > 0 else 0,
                "fail_count": fail_count
            }
        }
        
        async with conn.execute("SELECT * FROM history ORDER BY timestamp DESC LIMIT 50") as cursor:
            history_rows = await cursor.fetchall()
            
        recent_history = [dict(row) for row in history_rows]
    
    pdf_buffer = generate_pdf_report(stats, recent_history)
    
    headers = {
        'Content-Disposition': 'attachment; filename="inspection_report.pdf"'
    }
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)
