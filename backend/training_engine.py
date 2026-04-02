import os
import numpy as np
import pickle
import time
import threading

class TrainingJob:
    def __init__(self, job_id, profile_name, epochs=50, batch_size=32):
        self.job_id = job_id
        self.profile_name = profile_name
        self.epochs = int(epochs)
        self.batch_size = int(batch_size)
        
        self.status = "initializing" # initializing, training, completed, failed
        self.progress = 0
        self.current_epoch = 0
        self.logs = []
        self.metrics = {"loss": 0, "accuracy": 0}
        self.model = None
        self.error = None

    def log(self, message):
        timestamp = time.strftime("%H:%M:%S")
        self.logs.append(f"[{timestamp}] {message}")

    def load_data(self):
        self.log(f"Loading data for profile: {self.profile_name}...")
        data_dir = os.path.join("data", self.profile_name)
        
        X = []
        y = []
        
        categories = ["normal", "defect"]
        for label, category in enumerate(categories):
            cat_dir = os.path.join(data_dir, category)
            if not os.path.exists(cat_dir):
                self.log(f"Warning: Directory {cat_dir} not found.")
                continue
                
            files = os.listdir(cat_dir)
            self.log(f"Found {len(files)} images in {category}")
            
            for file in files:
                if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                    try:
                        from PIL import Image
                        img_path = os.path.join(cat_dir, file)
                        img = Image.open(img_path).convert('L') # Grayscale
                        img = img.resize((64, 64)) # Resize
                        img_array = np.array(img).flatten() / 255.0 # Normalize
                        X.append(img_array)
                        y.append(label)
                    except Exception as e:
                        self.log(f"Error loading {file}: {e}")

        return np.array(X), np.array(y)

    def start(self):
        self.thread = threading.Thread(target=self._run_training)
        self.thread.start()

    def _run_training(self):
        try:
            self.status = "training"
            
            # Check for YOLO data.yaml
            data_dir = os.path.join("data", self.profile_name)
            yaml_path = None
            if os.path.exists(data_dir):
                for root, dirs, files in os.walk(data_dir):
                    if 'data.yaml' in files:
                        yaml_path = os.path.join(root, 'data.yaml')
                        break
                        
            if yaml_path:
                self.log(f"Found YOLO data.yaml at {yaml_path}. Starting YOLOv8 training...")
                from ultralytics import YOLO
                
                self.model = YOLO('yolov8n.pt')
                self.progress = 20
                self.log(f"Training YOLOv8 for {self.epochs} epochs...")
                
                model_dir = "models"
                if not os.path.exists(model_dir):
                    os.makedirs(model_dir)

                # Train
                try:
                    results = self.model.train(
                        data=yaml_path,
                        epochs=self.epochs,
                        imgsz=640,
                        project=model_dir,
                        name=self.profile_name,
                        exist_ok=True, # overwrite existing
                        batch=self.batch_size,
                        verbose=False
                    )
                    self.progress = 100
                    self.status = "completed"
                    self.log("YOLOv8 Training completed successfully. Model saved to " + os.path.join(model_dir, self.profile_name, "weights", "best.pt"))
                except Exception as e:
                    self.status = "failed"
                    self.error = str(e)
                    self.log(f"YOLO Training failed: {e}")
                    import traceback
                    traceback.print_exc()
                return

            # --- Legacy Image Classification (MLP) Fallback ---
            X, y = self.load_data()
            
            if len(X) == 0:
                raise Exception("No training data found!")
                
            self.log(f"Data loaded. Shape: {X.shape}")
            
            from sklearn.neural_network import MLPClassifier
            # Initialize Model
            self.model = MLPClassifier(
                hidden_layer_sizes=(100, 50), 
                max_iter=1, # We will loop manually
                warm_start=True, # Allow partial_fit
                random_state=42
            )
            
            classes = np.unique(y)
            if len(classes) < 2:
                 # Handle case with only 1 class (e.g. only normal images)
                 # Add a dummy sample of the other class to prevent crash
                 self.log("Warning: Only one class found. Adding dummy sample for stability.")
                 dummy_X = np.zeros_like(X[0])
                 dummy_y = 1 if classes[0] == 0 else 0
                 X = np.vstack([X, dummy_X])
                 y = np.append(y, dummy_y)
                 classes = [0, 1]

            self.log(f"Starting training for {self.epochs} epochs...")
            
            for epoch in range(self.epochs):
                # Simulate batching if needed, but for MLP partial_fit handles it
                self.model.partial_fit(X, y, classes=classes)
                
                self.current_epoch = epoch + 1
                self.progress = (self.current_epoch / self.epochs) * 100
                
                # Update metrics
                loss = self.model.loss_ if hasattr(self.model, 'loss_') else 0
                acc = self.model.score(X, y)
                self.metrics = {"loss": round(loss, 4), "accuracy": round(acc, 4)}
                
                if epoch % 5 == 0:
                    self.log(f"Epoch {epoch+1}/{self.epochs} - Loss: {loss:.4f} - Acc: {acc:.4f}")
                
                time.sleep(0.1) # Slight delay to make UI visible
                
            self.status = "completed"
            self.log("Training completed successfully.")
            self.save_model()
            
        except Exception as e:
            self.status = "failed"
            self.error = str(e)
            self.log(f"Training failed: {e}")
            import traceback
            traceback.print_exc()

    def save_model(self):
        model_dir = "models"
        if not os.path.exists(model_dir):
            os.makedirs(model_dir)
            
        model_path = os.path.join(model_dir, f"{self.profile_name}.pkl")
        with open(model_path, 'wb') as f:
            pickle.dump(self.model, f)
        self.log(f"Model saved to {model_path}")

# Global Job Manager
training_jobs = {}

def start_training_job(profile_name, epochs, batch_size):
    job_id = str(int(time.time()))
    job = TrainingJob(job_id, profile_name, epochs, batch_size)
    training_jobs[job_id] = job
    job.start()
    return job_id

def get_job_status(job_id):
    job = training_jobs.get(job_id)
    if not job:
        return None
    return {
        "job_id": job.job_id,
        "status": job.status,
        "progress": job.progress,
        "current_epoch": job.current_epoch,
        "logs": job.logs[-5:], # Last 5 logs
        "metrics": job.metrics,
        "error": job.error
    }
