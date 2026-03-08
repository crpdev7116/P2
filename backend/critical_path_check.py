import requests

BASE = "http://127.0.0.1:8000"

def main():
    # 1) 2FA setup check for admin ID 1
    r1 = requests.post(f"{BASE}/users/1/2fa/setup")
    print("2FA_STATUS:", r1.status_code)
    try:
        j1 = r1.json()
    except Exception:
        j1 = {}
    print("2FA_HAS_OTPAUTH_URL:", "otpauth_url" in j1)
    print("2FA_HAS_BACKUP_CODES:", isinstance(j1.get("backup_codes"), list))

    # 2) User list check
    r2 = requests.get(f"{BASE}/users")
    print("USERS_STATUS:", r2.status_code)
    users = r2.json() if r2.headers.get("content-type", "").startswith("application/json") else []
    admin_row = next((u for u in users if u.get("id") == 1), None)
    print("ADMIN_ROW:", admin_row)
    print("ADMIN_ROLE_IS_UPPERCASE_ADMIN:", bool(admin_row and admin_row.get("role") == "ADMIN"))

    # 3) Optional login probe
    for ep in ["/login", "/token"]:
        try:
            r = requests.post(f"{BASE}{ep}", json={"email": "admin@crp.com", "password": "CRP_Admin_2026!"})
            print(f"{ep}_STATUS:", r.status_code)
            print(f"{ep}_BODY:", r.text[:200])
        except Exception as e:
            print(f"{ep}_ERROR:", str(e))

if __name__ == "__main__":
    main()
