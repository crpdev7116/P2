import sqlite3
from datetime import datetime, UTC
from passlib.context import CryptContext

DB_PATH = "backend/marketplace.db"

ADMIN = {
    "username": "admin",
    "email": "admin@crp.com",
    "password": "CRP_Admin_2026!",
    "role": "ADMIN",
}

CUSTOMER = {
    "username": "testuser",
    "email": "user@crp.com",
    "password": "CRP_User_2026!",
    "role": "CUSTOMER",
}

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def table_exists(cur, name: str) -> bool:
    row = cur.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        (name,),
    ).fetchone()
    return row is not None

def clear_table(cur, name: str):
    cur.execute(f"DELETE FROM {name}")

def reset_autoincrement(cur, name: str):
    if table_exists(cur, "sqlite_sequence"):
        cur.execute("DELETE FROM sqlite_sequence WHERE name = ?", (name,))

def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("PRAGMA foreign_keys = OFF")

    has_shops = table_exists(cur, "shops")
    has_merchants = table_exists(cur, "merchants")

    # Child-first clear order
    for t in [
        "order_items",
        "loyalty_stamps",
        "orders",
        "items",
        "customers",
        "categories",
        "merchants" if has_merchants else None,
        "shops" if has_shops else None,
        "users",
    ]:
        if t and table_exists(cur, t):
            clear_table(cur, t)

    # Reset autoincrement
    for t in ["users", "orders", "items", "merchants", "shops", "order_items", "customers", "categories", "loyalty_stamps"]:
        if table_exists(cur, t):
            reset_autoincrement(cur, t)

    now = datetime.now(UTC).isoformat()

    # Insert admin user (ID should become 1)
    admin_hash = hash_password(ADMIN["password"])
    cur.execute(
        """
        INSERT INTO users (username, email, password_hash, role, created_at, updated_at, is_banned, allowed_payment_methods, backup_codes)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
        """,
        (
            ADMIN["username"],
            ADMIN["email"],
            admin_hash,
            ADMIN["role"],
            now,
            now,
            '["CASH","PAYPAL","INVOICE"]',
            "[]",
        ),
    )
    admin_id = cur.lastrowid

    # Insert customer user (ID should become 2)
    customer_hash = hash_password(CUSTOMER["password"])
    cur.execute(
        """
        INSERT INTO users (username, email, password_hash, role, created_at, updated_at, is_banned, allowed_payment_methods, backup_codes)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
        """,
        (
            CUSTOMER["username"],
            CUSTOMER["email"],
            customer_hash,
            CUSTOMER["role"],
            now,
            now,
            '["CASH","PAYPAL","INVOICE"]',
            "[]",
        ),
    )
    customer_id = cur.lastrowid

    shop_info = None

    # Create sample shop as merchant fallback
    if has_merchants:
        cur.execute(
            """
            INSERT INTO merchants (user_id, name, email, password_hash, created_at, updated_at, package, domain_type, subdomain, custom_domain)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                admin_id,
                "CRP Demo Shop",
                "shop@crp.com",
                admin_hash,
                now,
                now,
                "TIER_250",
                "BASIC",
                "crp-demo",
                None,
            ),
        )
        shop_info = ("merchants", cur.lastrowid)

    elif has_shops:
        # Generic fallback if schema has shops instead of merchants
        cols = [r[1] for r in cur.execute("PRAGMA table_info(shops)").fetchall()]
        values = {}
        if "name" in cols:
            values["name"] = "CRP Demo Shop"
        if "owner_id" in cols:
            values["owner_id"] = admin_id
        if "user_id" in cols:
            values["user_id"] = admin_id
        if "created_at" in cols:
            values["created_at"] = now
        if "updated_at" in cols:
            values["updated_at"] = now

        if values:
            keys = ", ".join(values.keys())
            qmarks = ", ".join(["?"] * len(values))
            cur.execute(f"INSERT INTO shops ({keys}) VALUES ({qmarks})", tuple(values.values()))
            shop_info = ("shops", cur.lastrowid)

    conn.commit()
    cur.execute("PRAGMA foreign_keys = ON")

    users = cur.execute("SELECT id, username, email, role FROM users ORDER BY id").fetchall()
    counts = {}
    for t in ["users", "items", "orders", "merchants", "shops"]:
        if table_exists(cur, t):
            counts[t] = cur.execute(f"SELECT COUNT(1) FROM {t}").fetchone()[0]

    print("COUNTS:", counts)
    print("USERS:", users)
    print("EXPECTED_USER_IDS:", {"admin_id": admin_id, "customer_id": customer_id})
    print("SHOP_LINK:", shop_info)

    conn.close()

if __name__ == "__main__":
    main()
