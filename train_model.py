import os
import sys
import zipfile
import shutil
import yaml

def create_training_script():
    print("Welcome to QC AI Manual Training Script")
    print("---------------------------------------")
    
    zip_path = input("Enter the absolute path to your YOLOv8 dataset ZIP file: ").strip().strip('"')
    
    if not os.path.exists(zip_path):
        print(f"Error: Could not find file at {zip_path}")
        return
        
    if not zip_path.endswith('.zip'):
        print("Error: The file must be a .zip file.")
        return
        
    model_name = input("Enter the name for this model (e.g., 'welding_defect'): ").strip()
    if not model_name:
        model_name = "default_model"
        
    # Extraction directory
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend", "datasets", model_name))
    raw_dir = os.path.join(base_dir, "raw")
    os.makedirs(raw_dir, exist_ok=True)
    
    print(f"\nExtracting {zip_path} into {raw_dir}...")
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(raw_dir)
    except Exception as e:
        print(f"Failed to extract ZIP: {e}")
        return
        
    # Search for data.yaml
    yaml_path = None
    for root, dirs, files in os.walk(raw_dir):
        if 'data.yaml' in files:
            yaml_path = os.path.join(root, 'data.yaml')
            break
            
    if not yaml_path:
        print("Error: data.yaml not found inside the ZIP file. Please ensure it's a valid YOLO dataset.")
        return
        
    print(f"Found data.yaml at: {yaml_path}")
    
    # Update data.yaml with absolute paths
    yaml_dir = os.path.dirname(yaml_path)
    try:
        with open(yaml_path, 'r') as f:
            data = yaml.safe_load(f)
            
        data['path'] = os.path.abspath(yaml_dir)  # Set base path
        if 'train' in data and not os.path.isabs(data['train']):
             data['train'] = os.path.join(data['path'], data['train'])
        if 'val' in data and not os.path.isabs(data['val']):
             data['val'] = os.path.join(data['path'], data['val'])
             
        with open(yaml_path, 'w') as f:
            yaml.dump(data, f, default_flow_style=False)
        print("Successfully updated data.yaml with absolute paths.")
    except Exception as e:
        print(f"Note: Could not update data.yaml paths automatically: {e}")
        
    # Start Training
    epochs_input = input("Enter number of epochs [default: 50]: ").strip()
    epochs = int(epochs_input) if epochs_input.isdigit() else 50
    
    print("\nStarting YOLOv8 Training...")
    try:
        from ultralytics import YOLO
    except ImportError:
        print("Error: ultralytics is not installed. Please run:")
        print("pip install ultralytics")
        return
        
    try:
        model = YOLO('yolov8n.pt')
        project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend", "models", model_name))
        os.makedirs(project_dir, exist_ok=True)
        
        results = model.train(
            data=yaml_path,
            epochs=epochs,
            imgsz=640,
            project=project_dir,
            name="weights",
            exist_ok=True,
            device='cpu' # Run on CPU by default for broader compatibility, change to 0 if CUDA is available
        )
        print("\n\n-------------------------")
        print("Training Completed Successfully!")
        print(f"Model saved to: {os.path.join(project_dir, 'weights', 'weights', 'best.pt')}")
        print("-------------------------")
    except Exception as e:
        print(f"Training failed: {e}")

if __name__ == "__main__":
    create_training_script()
