import requests

BASE = "http://127.0.0.1:8000"


def login(identifier, password="123456"):
    r = requests.post(f"{BASE}/login", json={"identifier": identifier, "password": password})
    return r.status_code, r.json()


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def main():
    print("=== THOROUGH TICKET TEST MATRIX ===")

    # Login
    sa, ja = login("admin")
    st, jt = login("testuser")
    ss, js = login("seller")

    print("LOGIN_ADMIN:", sa)
    print("LOGIN_TESTUSER:", st)
    print("LOGIN_SELLER:", ss)

    admin_token = ja.get("access_token")
    testuser_token = jt.get("access_token")
    seller_token = js.get("access_token")

    if not all([admin_token, testuser_token, seller_token]):
        print("FAIL: Missing one or more tokens")
        return

    # 1) Isolation Check
    r = requests.post(
        f"{BASE}/admin/tickets/create",
        headers=auth_header(admin_token),
        json={
            "category": "BUG",
            "subject": "seller-owned-ticket",
            "target_user_email": "seller",
            "message": "seed seller ticket"
        },
    )
    print("CREATE_SELLER_TICKET:", r.status_code)
    seller_ticket_id = r.json().get("id") if r.ok else None

    isolation_status = None
    if seller_ticket_id:
        r = requests.get(
            f"{BASE}/tickets/{seller_ticket_id}",
            headers=auth_header(testuser_token),
        )
        isolation_status = r.status_code
        print("ISOLATION_STATUS (expect 403/404):", isolation_status)
    else:
        print("ISOLATION_STATUS: SKIPPED (no ticket id)")

    # 2) State machine check
    r = requests.post(
        f"{BASE}/admin/tickets/create",
        headers=auth_header(admin_token),
        json={
            "category": "BUG",
            "subject": "state-machine-ticket",
            "target_user_email": "testuser",
            "message": "admin init"
        },
    )
    print("CREATE_STATE_TICKET:", r.status_code)
    state_ticket_id = r.json().get("id") if r.ok else None

    set_waiting_status = None
    post_reply_status = None
    final_state = None

    if state_ticket_id:
        r = requests.patch(
            f"{BASE}/tickets/{state_ticket_id}/status",
            headers={**auth_header(admin_token), "Content-Type": "application/json"},
            json={"status": "WAITING_FOR_REPLY"},
        )
        set_waiting_status = r.status_code
        print("SET_WAITING_STATUS:", set_waiting_status, r.json().get("status") if r.headers.get("content-type", "").startswith("application/json") else None)

        r = requests.post(
            f"{BASE}/tickets/{state_ticket_id}/messages",
            headers={**auth_header(testuser_token), "Content-Type": "application/json"},
            json={"message": "customer reply"},
        )
        post_reply_status = r.status_code
        print("POST_REPLY_STATUS:", post_reply_status)

        r = requests.get(
            f"{BASE}/tickets/{state_ticket_id}",
            headers=auth_header(admin_token),
        )
        final_state = r.json().get("status") if r.headers.get("content-type", "").startswith("application/json") else None
        print("STATE_AFTER_REPLY (expect OPEN):", r.status_code, final_state)
    else:
        print("STATE_MACHINE: SKIPPED (no ticket id)")

    # 3) Legacy approve check
    r = requests.put(
        f"{BASE}/users/4",
        headers={"Content-Type": "application/json"},
        json={"first_name": "ChangedByRequest"},
    )
    print("DATA_CHANGE_TRIGGER_UPDATE:", r.status_code)

    r = requests.get(f"{BASE}/tickets", headers=auth_header(admin_token))
    all_tickets = r.json() if r.headers.get("content-type", "").startswith("application/json") else []
    data_change_tickets = [
        t for t in all_tickets
        if t.get("user_id") == 4 and t.get("category") == "DATA_CHANGE" and t.get("status") in ["OPEN", "WAITING_FOR_REPLY"]
    ]
    data_change_tickets.sort(key=lambda x: x.get("id", 0))
    legacy_ticket = data_change_tickets[-1] if data_change_tickets else None
    legacy_ticket_id = legacy_ticket.get("id") if legacy_ticket else None
    print("LEGACY_TICKET_FOUND:", bool(legacy_ticket_id), legacy_ticket_id)

    legacy_approve_status = None
    if legacy_ticket_id:
        r = requests.post(
            f"{BASE}/admin/tickets/{legacy_ticket_id}/approve",
            headers=auth_header(admin_token),
        )
        legacy_approve_status = r.status_code
        print("LEGACY_APPROVE_STATUS (expect 200):", legacy_approve_status)
    else:
        print("LEGACY_APPROVE_STATUS: SKIPPED_NO_TICKET")

    # Summary checks
    checks = {
        "isolation_ok": isolation_status in (403, 404),
        "set_waiting_ok": set_waiting_status == 200,
        "post_reply_ok": post_reply_status == 200,
        "auto_reopen_ok": final_state == "OPEN",
        "legacy_approve_ok": legacy_approve_status == 200,
    }

    print("CHECKS:", checks)
    print("ALL_PASS:", all(checks.values()))


if __name__ == "__main__":
    main()
