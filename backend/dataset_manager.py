import os
import json
from database import get_db_connection

class DatasetManager:
    def __init__(self):
        self.base_path = "data"
        if not os.path.exists(self.base_path):
            os.makedirs(self.base_path)
        
        self.current_profile_name = "Generic"
        self.current_profile_data = self.load_profile("Generic")

    def _ensure_profile_dirs(self, profile_name):
        for category in ["normal", "defect"]:
            path = os.path.join(self.base_path, profile_name, category)
            if not os.path.exists(path):
                os.makedirs(path)

    def get_profiles(self):
        conn = get_db_connection()
        profiles = conn.execute("SELECT name FROM profiles").fetchall()
        conn.close()
        
        valid_profiles = []
        for p in profiles:
            name = p['name']
            name_ul = name.replace(" ", "_")
            name_sp = name.replace("_", " ")

            for n in [name, name_ul, name_sp]:
                path_a = os.path.join("models", n, "weights", "best.pt")
                path_b = os.path.join("models", n, "weights", "weights", "best.pt")
                if os.path.exists(path_a) or os.path.exists(path_b):
                    valid_profiles.append(name)
                    break
                
        # To avoid duplicates if name == name_ul
        return list(dict.fromkeys(valid_profiles))

    def load_profile(self, profile_name):
        conn = get_db_connection()
        profile = conn.execute("SELECT * FROM profiles WHERE name = ?", (profile_name,)).fetchone()
        
        if not profile:
            # Fallback to Generic if not found
            profile = conn.execute("SELECT * FROM profiles WHERE name = 'Generic'").fetchone()
            if not profile:
                conn.close()
                return None # Should not happen if migrated correctly
            profile_name = "Generic"

        # Get defects
        defects = conn.execute("SELECT name FROM defects WHERE profile_id = ?", (profile['id'],)).fetchall()
        conn.close()

        self.current_profile_name = profile['name']
        self.current_profile_data = {
            "defects": [d['name'] for d in defects],
            "good_criteria": profile['good_criteria'],
            "thresholds": json.loads(profile['thresholds'])
        }
        return self.current_profile_data

    def get_current_defects(self):
        return self.current_profile_data["defects"]

    def create_profile(self, name: str, defects: list, good_criteria: str):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            # Insert Profile
            cursor.execute(
                "INSERT INTO profiles (name, good_criteria, thresholds) VALUES (?, ?, ?)",
                (name, good_criteria, json.dumps({"confidence": 0.88}))
            )
            profile_id = cursor.lastrowid
            
            # Insert Defects
            for defect in defects:
                cursor.execute(
                    "INSERT INTO defects (profile_id, name) VALUES (?, ?)",
                    (profile_id, defect)
                )
            conn.commit()
            
            self._ensure_profile_dirs(name)
            
            return {
                "defects": defects,
                "good_criteria": good_criteria,
                "thresholds": {"confidence": 0.88}
            }
        except Exception as e:
            print(f"Error creating profile: {e}")
            return None
        finally:
            conn.close()

    def save_image(self, profile_name, category, file_data, filename):
        # Verify profile exists
        conn = get_db_connection()
        exists = conn.execute("SELECT 1 FROM profiles WHERE name = ?", (profile_name,)).fetchone()
        conn.close()

        if not exists:
            return False, "Profile not found"
        
        if category not in ["normal", "defect"]:
            return False, "Invalid category"

        # Ensure dirs exist (just in case)
        self._ensure_profile_dirs(profile_name)

        save_path = os.path.join(self.base_path, profile_name, category, filename)
        try:
            with open(save_path, "wb") as buffer:
                buffer.write(file_data)
            return True, f"Saved to {save_path}"
        except Exception as e:
            return False, str(e)

    def extract_zip_dataset(self, profile_name, zip_bytes):
        # Extract a YOLO format zip file for a profile
        import zipfile
        import io
        import yaml
        
        profile_dir = os.path.join(self.base_path, profile_name)
        if not os.path.exists(profile_dir):
            os.makedirs(profile_dir)
            
        try:
            with zipfile.ZipFile(io.BytesIO(zip_bytes), 'r') as zip_ref:
                # Security: prevent path traversal but this is a controlled env
                zip_ref.extractall(profile_dir)
                
            # Check if data.yaml exists
            yaml_path = None
            for root, dirs, files in os.walk(profile_dir):
                if 'data.yaml' in files:
                    yaml_path = os.path.join(root, 'data.yaml')
                    break
                    
            if yaml_path:
                # We need to rewrite paths in data.yaml to be absolute
                # because Ultralytics can be picky about relative paths
                with open(yaml_path, 'r') as f:
                    data = yaml.safe_load(f)
                
                base_dataset_dir = os.path.dirname(yaml_path)
                data['path'] = os.path.abspath(base_dataset_dir)
                
                # Make sure train/val are relative to path
                if 'train' in data and not os.path.isabs(data['train']):
                     pass # handled by 'path' internally by YOLO
                     
                with open(yaml_path, 'w') as f:
                    yaml.dump(data, f)
                return True, f"Extracted successfully. Found YAML at {yaml_path}", yaml_path
                
            return True, "Extracted successfully, but no data.yaml found. You may need to structure it correctly.", None
        except Exception as e:
            import traceback
            traceback.print_exc()
            return False, f"Error extracting ZIP: {e}", None
