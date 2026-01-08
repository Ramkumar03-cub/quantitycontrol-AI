import random
import time

class AIEngine:
    def __init__(self):
        self.product_context = {"name": "Generic Product", "material": "Generic Material"}

    def update_context(self, name: str, material: str):
        self.product_context = {"name": name, "material": material}

    def analyze_defect(self, defect_type: str, sensor_data: dict) -> dict:
        """
        Simulates an LLM-based Root Cause Analysis.
        """
        product = self.product_context["name"]
        material = self.product_context["material"]
        
        # Mock Logic for "AI" reasoning
        reasons = [
            f"Potential thermal stress in {material} causing {defect_type}.",
            f"Calibration drift detected during {product} assembly.",
            f"Foreign material contamination on the {material} surface.",
            f"Micro-fractures in {material} due to excessive vibration ({sensor_data.get('vibration', 0):.2f}g)."
        ]
        
        recommendations = [
            "Inspect cooling system for efficiency drops.",
            "Recalibrate the robotic arm pressure sensors.",
            "Check raw material batch #402 for consistency.",
            "Schedule preventive maintenance for the conveyor belt."
        ]

        return {
            "root_cause": random.choice(reasons),
            "confidence": round(random.uniform(0.85, 0.98), 2),
            "recommendation": random.choice(recommendations),
            "timestamp": time.time()
        }

    def predict_maintenance(self, sensor_history: list) -> dict:
        """
        Predicts system health and maintenance needs.
        """
        # Simulate health decaying over time or based on random factors
        health_score = max(0, min(100, 100 - (time.time() % 1000) / 20 + random.randint(-5, 5)))
        
        status = "Healthy"
        if health_score < 80:
            status = "Warning"
        if health_score < 60:
            status = "Critical"

        return {
            "health_score": round(health_score, 1),
            "status": status,
            "predicted_failure_hours": int(health_score * 2.5),
            "maintenance_required": health_score < 75
        }
