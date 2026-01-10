import requests
try:
    response = requests.get("http://localhost:8000/")
    print(f"Root Status: {response.status_code}")
    print(f"Root Response: {response.text}")
except Exception as e:
    print(f"Root Request failed: {e}")
