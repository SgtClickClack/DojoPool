import requests
import json

url = "http://127.0.0.1:5000/api/v1/auth/login"
payload = {
    "email": "admin@dojopool.com",
    "password": "Password123!"
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    try:
        print(response.json())
    except json.JSONDecodeError:
        print(response.text)
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}") 