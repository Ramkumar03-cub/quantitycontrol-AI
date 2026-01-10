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

    def train_model(self, history_data):
        """
        Trains a Linear Regression model on historical sensor data.
        """
        try:
            from sklearn.linear_model import LinearRegression
            import numpy as np
            
            if not history_data:
                return False
                
            # Prepare training data
            X = []
            y = []
            
            for record in history_data:
                sensors = record.get('sensor_data')
                if not sensors:
                    sensors = {}
                # Feature vector: [vibration, temperature, pressure]
                features = [
                    sensors.get('vibration', 0),
                    sensors.get('temperature', 0),
                    sensors.get('pressure', 0)
                ]
                X.append(features)
                
                # Synthetic target: Health Score (0-100)
                # In a real scenario, this would be 'time_to_failure' or actual health labels
                # Here we simulate a ground truth based on physics
                vib = sensors.get('vibration', 0)
                temp = sensors.get('temperature', 0)
                
                # Health drops as vibration > 0.5 or temp > 80
                penalty = max(0, (vib - 0.2) * 50) + max(0, (temp - 60) * 2)
                health = max(0, 100 - penalty)
                y.append(health)
                
            if len(X) < 5: # Need minimal data
                return False
                
            self.model = LinearRegression()
            self.model.fit(X, y)
            self.is_trained = True
            return True
        except Exception as e:
            print(f"Training error: {e}")
            return False

    def predict_maintenance(self, current_sensors: dict) -> dict:
        """
        Predicts system health using the trained model.
        """
        try:
            print("Executing predict_maintenance...")
            # Prepare input
            features = [[
                current_sensors.get('vibration', 0),
                current_sensors.get('temperature', 0),
                current_sensors.get('pressure', 0)
            ]]
            
            health_score = 100
            used_model = False
            
            if hasattr(self, 'is_trained') and self.is_trained and hasattr(self, 'model'):
                try:
                    health_score = self.model.predict(features)[0]
                    health_score = max(0, min(100, health_score)) # Clamp
                    used_model = True
                except Exception as e:
                    print(f"Prediction error (using fallback): {e}")
            
            if not used_model:
                 # Simple fallback logic
                vib = current_sensors.get('vibration', 0)
                # Simple physics: high vibration = low health
                health_score = max(0, 100 - (vib * 20)) # Scale vib 0-5 to 0-100 penalty

            status = "Healthy"
            if health_score < 80:
                status = "Warning"
            if health_score < 60:
                status = "Critical"

            # Estimate failure time (heuristic based on health)
            try:
                hours_to_failure = int(health_score * 5) # Max 500 hours
            except:
                hours_to_failure = 0

            import math
            if math.isnan(health_score) or math.isinf(health_score):
                health_score = 0.0
                
            return {
                "health_score": float(round(health_score, 1)),
                "status": str(status),
                "predicted_failure_hours": int(hours_to_failure),
                "maintenance_required": bool(health_score < 75)
            }
        except Exception as e:
            print(f"Critical error in predict_maintenance: {e}")
            return {
                "health_score": 0,
                "status": "Error",
                "predicted_failure_hours": 0,
                "maintenance_required": True
            }
