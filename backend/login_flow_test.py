import requests
from jose import jwt

BASE_URL = "http://127.0.0.1:8000"
JWT_SECRET_KEY = "crp-super-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"

def main():
    payload = {
        "identifier": "admin@crp.com",
        "password": "CRP_Admin_2026!"
    }

    r = requests.post(f"{BASE_URL}/login", json=payload)
    print("LOGIN_STATUS:", r.status_code)
    print("LOGIN_BODY:", r.text)

    if r.status_code != 200:
        return

    data = r.json()
    token = data.get("access_token")
    print("HAS_TOKEN:", bool(token))

    decoded = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    print("TOKEN_DECODED:", decoded)
    print("HAS_USER_ID:", "user_id" in decoded)
    print("HAS_ROLE:", "role" in decoded)
    print("HAS_EXP:", "exp" in decoded)

if __name__ == "__main__":
    main()
