import random
import time
import json
import asyncio

class SensorSimulator:
    def __init__(self):
        self.temperature = 60.0  # Celsius
        self.pressure = 100.0    # PSI
        self.vibration = 0.5     # mm/s
        self.defect_probability = 0.05

    def update_params(self, defect_prob=None):
        if defect_prob is not None:
            self.defect_probability = max(0.0, min(1.0, defect_prob))

    def update(self):
        # Random walk for sensor values
        self.temperature += random.uniform(-0.5, 0.5)
        self.pressure += random.uniform(-1.0, 1.0)
        self.vibration += random.uniform(-0.05, 0.05)

        # Keep within realistic bounds
        self.temperature = max(20.0, min(120.0, self.temperature))
        self.pressure = max(50.0, min(150.0, self.pressure))
        self.vibration = max(0.0, min(5.0, self.vibration))

        return {
            "temperature": round(self.temperature, 2),
            "pressure": round(self.pressure, 2),
            "vibration": round(self.vibration, 3),
            "timestamp": time.time()
        }

    def check_anomalies(self):
        # Step 4: Sensor-Based Quality Analysis
        anomalies = []
        
        # Threshold-based anomaly detection
        if self.temperature > 100.0:
            anomalies.append({
                "type": "Overheating",
                "value": self.temperature,
                "threshold": 100.0
            })
            
        if self.pressure < 60.0 or self.pressure > 140.0:
             anomalies.append({
                "type": "Pressure Abnormal",
                "value": self.pressure,
                "threshold": "60-140"
            })
            
        if self.vibration > 4.0:
             anomalies.append({
                "type": "High Vibration",
                "value": self.vibration,
                "threshold": 4.0
            })

        # Random simulated defect event (kept for demo variety)
        if random.random() < self.defect_probability:
             anomalies.append({
                "type": "Simulated Malfunction",
                "value": 1.0,
                "threshold": 0.0
            })
            
        return anomalies
