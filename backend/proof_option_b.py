import requests
from sqlalchemy import create_engine, text

BASE_URL = "http://127.0.0.1:8000"
DB_URL = "sqlite:///backend/marketplace.db"


def login(identifier: str, password: str) -> str:
    r = requests.post(f"{BASE_URL}/login", json={"identifier": identifier, "password": password}, timeout=20)
    r.raise_for_status()
    return r.json()["access_token"]


def get_first_item():
    r = requests.get(f"{BASE_URL}/items", timeout=20)
    r.raise_for_status()
    data = r.json()
    if not isinstance(data, list) or not data:
        raise RuntimeError(f"/items is not a non-empty list. payload={data}")
    return data[0]


def main():
    admin_token = login("admin@crp.com", "123456")
    seller_token = login("seller@crp.com", "123456")

    admin_headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    seller_headers = {"Authorization": f"Bearer {seller_token}", "Content-Type": "application/json"}

    item = get_first_item()
    item_id = int(item["id"])
    merchant_id = int(item["merchant_id"])

    engine = create_engine(DB_URL)

    with engine.begin() as conn:
        conn.execute(
            text(
                "UPDATE items "
                "SET price_standard=100.0, discount_percentage=10.0, fixed_discount_price=NULL "
                "WHERE id=:item_id"
            ),
            {"item_id": item_id},
        )

    cp_res = requests.post(
        f"{BASE_URL}/admin/custom-prices",
        headers=admin_headers,
        json={"merchant_id": merchant_id, "user_id": 3, "item_id": item_id, "price": 50.0},
        timeout=20,
    )

    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT id FROM customers WHERE user_id=:uid AND merchant_id=:mid LIMIT 1"),
            {"uid": 3, "mid": merchant_id},
        ).fetchone()

    if not row:
        raise RuntimeError("No customer row found for user_id=3 and selected merchant_id")

    customer_id = int(row[0])

    order_res = requests.post(
        f"{BASE_URL}/orders",
        params={"merchant_id": merchant_id},
        headers=admin_headers,
        json={
            "customer_id": customer_id,
            "payment_method": "cash",
            "items": [{"item_id": item_id, "quantity": 1, "price_per_unit": 0, "price_type": "standard"}],
        },
        timeout=20,
    )

    unread_before_res = requests.get(
        f"{BASE_URL}/notifications/unread-count",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=20,
    )
    unread_before = unread_before_res.json()

    ticket_res = requests.post(
        f"{BASE_URL}/tickets",
        headers=admin_headers,
        json={"subject": "Proof Ticket", "category": "GENERAL", "message": "init", "assigned_to_user_id": 3},
        timeout=20,
    )
    ticket_id = ticket_res.json()["id"]

    msg_res = requests.post(
        f"{BASE_URL}/tickets/{ticket_id}/messages",
        headers=seller_headers,
        json={"message": "reply for unread +1 proof"},
        timeout=20,
    )

    unread_after_res = requests.get(
        f"{BASE_URL}/notifications/unread-count",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=20,
    )
    unread_after = unread_after_res.json()

    print("=== OPTION B PROOF OUTPUT ===")
    print("CUSTOM_PRICE_SET_STATUS:", cp_res.status_code)
    print("CUSTOM_PRICE_SET_BODY:", cp_res.text)

    print("ORDER_STATUS:", order_res.status_code)
    print("ORDER_BODY:", order_res.text)

    if order_res.ok:
        order_data = order_res.json()
        first_line = (order_data.get("items") or [{}])[0]
        print("ORDER_LINE_PRICE_PER_UNIT:", first_line.get("price_per_unit"))
        print("ORDER_LINE_PRICE_TYPE:", first_line.get("price_type"))

    print("TICKET_CREATE_STATUS:", ticket_res.status_code)
    print("TICKET_CREATE_BODY:", ticket_res.text)

    print("TICKET_MESSAGE_STATUS:", msg_res.status_code)
    print("TICKET_MESSAGE_BODY:", msg_res.text)

    print("UNREAD_BEFORE:", unread_before)
    print("UNREAD_AFTER:", unread_after)
    before = int(unread_before.get("unread", 0))
    after = int(unread_after.get("unread", 0))
    print("UNREAD_DELTA:", after - before)


if __name__ == "__main__":
    main()
