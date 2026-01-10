import requests
import json

url = "http://localhost:8000/auth/register"
data = {
    "username": "testuser_debug",
    "password": "testpassword123"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
