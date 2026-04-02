import os
import zipfile
import yaml
from ultralytics import YOLO

def auto_train():
    zip_path = r"d:\projects\QC AI\The Welding Defect Dataset.zip"
    model_name = "welding_defect"
    
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "datasets", model_name))
    raw_dir = "\\\\?\\" + os.path.join(base_dir, "raw")
    os.makedirs(raw_dir, exist_ok=True)
    
    print(f"Extracting {zip_path} into {raw_dir}...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(raw_dir)
        
    yaml_path = None
    for root, dirs, files in os.walk(raw_dir):
        if 'data.yaml' in files:
            yaml_path = os.path.join(root, 'data.yaml')
            break
            
    if not yaml_path:
        print("Error: data.yaml not found!")
        return
        
    yaml_dir = os.path.dirname(yaml_path)
    with open(yaml_path, 'r') as f:
        data = yaml.safe_load(f)
        
    data['path'] = os.path.abspath(yaml_dir)
    if 'train' in data and not os.path.isabs(data['train']):
         data['train'] = os.path.join(data['path'], data['train'])
    if 'val' in data and not os.path.isabs(data['val']):
         data['val'] = os.path.join(data['path'], data['val'])
         
    with open(yaml_path, 'w') as f:
        yaml.dump(data, f, default_flow_style=False)
        
    print("Training YOLO model...")
    model = YOLO('yolov8n.pt')
    project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "models", model_name))
    
    model.train(
        data=yaml_path,
        epochs=5,
        imgsz=640,
        project=project_dir,
        name="weights",
        exist_ok=True,
    )
    print("Done! Model saved in models/welding_defect/weights/weights/best.pt")

if __name__ == "__main__":
    auto_train()
