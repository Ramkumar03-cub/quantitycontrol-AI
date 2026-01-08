from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import time

class InspectionResult(BaseModel):
    timestamp: float
    status: str  # "PASS" or "FAIL"
    vision_defects: List[Dict[str, Any]]
    sensor_anomalies: List[Dict[str, Any]]
    sensor_data: Dict[str, float]
    final_decision_reason: Optional[str] = None

class DecisionEngine:
    def __init__(self):
        pass

    def evaluate(self, vision_detections: List[Dict], sensor_data: Dict, sensor_anomalies: List[Dict]) -> InspectionResult:
        """
        Combines vision and sensor data to make a final quality decision.
        Step 5: Multi-Modal Decision Making
        """
        status = "PASS"
        reasons = []

        # Check Vision Results (Step 3)
        if vision_detections:
            status = "FAIL"
            for d in vision_detections:
                reasons.append(f"Vision: {d['label']} detected")

        # Check Sensor Results (Step 4)
        if sensor_anomalies:
            status = "FAIL"
            for a in sensor_anomalies:
                reasons.append(f"Sensor: {a['type']} ({a['value']})")

        return InspectionResult(
            timestamp=time.time(),
            status=status,
            vision_defects=vision_detections,
            sensor_anomalies=sensor_anomalies,
            sensor_data=sensor_data,
            final_decision_reason="; ".join(reasons) if reasons else "All checks passed"
        )
