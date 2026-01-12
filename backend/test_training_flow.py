import requests
import time
import os
from PIL import Image
import io

BASE_URL = "http://localhost:8000"
PROFILE_NAME = "TestProfile_Auto"

def create_dummy_image(color):
    img = Image.new('RGB', (64, 64), color)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()

def run_test():
    print(f"1. Creating Profile: {PROFILE_NAME}")
    res = requests.post(f"{BASE_URL}/dataset/create", json={
        "name": PROFILE_NAME,
        "defects": ["Defect A"],
        "good_criteria": "None"
    })
    print(res.json())

    print("2. Uploading Data...")
    # Upload 10 normal (black) images
    for i in range(10):
        files = {'file': ('normal.png', create_dummy_image('black'), 'image/png')}
        requests.post(f"{BASE_URL}/dataset/upload", files=files, data={'profile_name': PROFILE_NAME, 'category': 'normal'})
    
    # Upload 10 defect (white) images
    for i in range(10):
        files = {'file': ('defect.png', create_dummy_image('white'), 'image/png')}
        res = requests.post(f"{BASE_URL}/dataset/upload", files=files, data={'profile_name': PROFILE_NAME, 'category': 'defect'})
        if res.status_code != 200:
            print(f"Upload failed: {res.text}")
    print("Upload complete.")

    print("3. Starting Training...")
    res = requests.post(f"{BASE_URL}/ai/train", json={
        "profile_name": PROFILE_NAME,
        "epochs": 10,
        "batch_size": 5
    })
    try:
        data = res.json()
    except:
        print(f"Training Start Failed: {res.text}")
        return
    print(data)
    job_id = data.get("job_id")
    
    if not job_id:
        print("Failed to start training")
        return

    print(f"4. Polling Job {job_id}...")
    while True:
        res = requests.get(f"{BASE_URL}/ai/train/{job_id}")
        status = res.json()
        print(f"Status: {status['status']} | Epoch: {status.get('current_epoch')} | Acc: {status.get('metrics', {}).get('accuracy')}")
        
        if status['status'] in ['completed', 'failed']:
            break
        time.sleep(1)

    print("Final Status:", status)

if __name__ == "__main__":
    run_test()
