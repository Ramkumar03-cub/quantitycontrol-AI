import time
import json
import os
from report_generator import generate_pdf_report

def test_report_generation():
    print("Testing Report Generation...")
    
    # Mock Data
    stats = {
        "kpi": {
            "total_inspections": 150,
            "pass_rate": 95.5,
            "fail_count": 7
        }
    }
    
    recent_history = []
    # Add some pass records
    for i in range(5):
        recent_history.append({
            "id": i+1,
            "timestamp": time.time() - (i * 60),
            "status": "PASS",
            "vision_defects": None
        })
        
    # Add a fail record
    recent_history.append({
        "id": 6,
        "timestamp": time.time() - 300,
        "status": "FAIL",
        "vision_defects": json.dumps([{"label": "Crack", "confidence": 0.95}, {"label": "Scratch", "confidence": 0.88}])
    })
    
    # Generate PDF
    try:
        pdf_buffer = generate_pdf_report(stats, recent_history)
        
        # Save to file to inspect
        output_filename = "test_report.pdf"
        with open(output_filename, "wb") as f:
            f.write(pdf_buffer.getvalue())
            
        print(f"SUCCESS: {output_filename} generated. Size: {len(pdf_buffer.getvalue())} bytes.")
        
        # Verify file exists and is not empty
        if os.path.exists(output_filename) and os.path.getsize(output_filename) > 0:
            print("Verification PASSED.")
        else:
            print("Verification FAILED: File missing or empty.")
            
    except Exception as e:
        print(f"FAILED: Error generating report: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_report_generation()
