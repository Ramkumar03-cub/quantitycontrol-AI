import cv2
import numpy as np
import random

class CVEngine:
    def __init__(self):
        self.width = 640
        self.height = 480
        self.defect_types = ["Crack", "Dent", "Scratch"] # Default

    def update_product_context(self, name: str, material: str):
        # Update defect types based on material/product
        material = material.lower()
        if "glass" in material:
            self.defect_types = ["Crack", "Chip", "Bubble"]
        elif "fabric" in material or "cloth" in material:
            self.defect_types = ["Tear", "Stain", "Weave Error"]
        elif "metal" in material:
            self.defect_types = ["Rust", "Dent", "Scratch"]
        else:
            self.defect_types = ["Defect A", "Defect B", "Surface Flaw"]

    def process_frame(self, frame):
        # Step 2: Data Pre-Processing
        # Simulate resizing and normalization
        resized = cv2.resize(frame, (self.width, self.height))
        normalized = resized.astype(np.float32) / 255.0
        
        # In a real scenario, this would run a DL model.
        # Here we simulate processing and occasionally drawing a bounding box.
        
        # Convert to grayscale to simulate some processing
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Step 3: AI-Based Defect Detection
        detections = []
        if random.random() < 0.1: # 10% chance of defect per frame for demo
            x = random.randint(50, self.width - 150)
            y = random.randint(50, self.height - 150)
            w = random.randint(50, 100)
            h = random.randint(50, 100)
            
            confidence = round(random.uniform(0.85, 0.99), 2)
            detection = {
                "box": [x, y, w, h], 
                "label": "Defect",
                "type": random.choice(self.defect_types),
                "confidence": confidence
            }
            detections.append(detection)
            
            # Draw on frame
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 0, 255), 2)
            label_text = f"{detection['type']} {int(confidence*100)}%"
            cv2.putText(frame, label_text, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

        # Encode frame to JPEG
        ret, buffer = cv2.imencode('.jpg', frame)
        return buffer.tobytes(), detections
