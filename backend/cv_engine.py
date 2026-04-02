import cv2
import numpy as np
import random
import os

class CVEngine:
    def __init__(self):
        self.width = 640
        self.height = 480
        self.defect_types = ["Crack", "Dent", "Scratch"] # Default
        self.yolo_model = None

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

    def load_profile_model(self, profile_name: str):
        model_path = ""
        name_ul = profile_name.replace(" ", "_")
        name_sp = profile_name.replace("_", " ")

        for n in [profile_name, name_ul, name_sp]:
            path_a = os.path.join("models", n, "weights", "best.pt")
            path_b = os.path.join("models", n, "weights", "weights", "best.pt")
            
            if os.path.exists(path_b):
                model_path = path_b
                break
            elif os.path.exists(path_a):
                model_path = path_a
                break
        
        self.yolo_model = None
        if os.path.exists(model_path):
            try:
                from ultralytics import YOLO
                self.yolo_model = YOLO(model_path)
                print(f"Loaded YOLOv8 model from {model_path}")
            except Exception as e:
                print(f"Failed to load YOLO model: {e}")
        else:
            print(f"No YOLO model found at {model_path}, using mock logic.")

    def process_frame(self, frame):
        # Step 2: Data Pre-Processing
        # Resize to standard width/height
        resized = cv2.resize(frame, (self.width, self.height))
        detections = []
        
        if self.yolo_model is not None:
            # Use real YOLOv8 inference with a very low threshold because the model only trained for 3 epochs
            results = self.yolo_model(resized, verbose=False, conf=0.05)
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    conf = float(box.conf[0])
                    cls = int(box.cls[0])
                    label_name = self.yolo_model.names[cls]
                    
                    x, y, w, h = int(x1), int(y1), int(x2-x1), int(y2-y1)
                    
                    lower_label = label_name.lower()
                    if "bad" in lower_label or "defect" in lower_label:
                        severity = "critical"
                    elif "good" in lower_label or "ok" in lower_label:
                        severity = "pass"
                    else:
                        severity = "warning"

                    detection = {
                        "box": [x, y, w, h], 
                        "label": label_name,
                        "type": label_name,
                        "severity": severity,
                        "confidence": round(conf, 2)
                    }
                    detections.append(detection)
                    
                    if severity == "pass":
                        color = (0, 255, 0)
                    elif severity == "critical":
                        color = (0, 0, 255)
                    else:
                        color = (0, 255, 255)
                        
                    # Draw on frame
                    cv2.rectangle(resized, (x, y), (x+w, int(y2)), color, 2)
                    label_text = f"{label_name} {int(conf*100)}%"
                    cv2.putText(resized, label_text, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
        else:
            # In a real scenario, this would run a DL model.
            # Here we simulate processing and occasionally drawing a bounding box.
            
            # Convert to grayscale to simulate some processing
            gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
            
            # Step 3: AI-Based Defect Detection
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
                cv2.rectangle(resized, (x, y), (x+w, y+h), (0, 0, 255), 2)
                label_text = f"{detection['type']} {int(confidence*100)}%"
                cv2.putText(resized, label_text, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

        # Encode frame to JPEG
        ret, buffer = cv2.imencode('.jpg', resized)
        return buffer.tobytes(), detections
