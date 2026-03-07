import sqlite3
import bcrypt
from datetime import datetime

DB_PATH = "backend/marketplace.db"

USERNAME = "crp_admin"
EMAIL = "crp_admin@crp.local"
PASSWORD = "AdminPass2026!"
ROLE = "ADMIN"

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Ensure role normalization before insert/update
    cur.execute("UPDATE users SET role = UPPER(role)")
    conn.commit()

    hashed = get_password_hash(PASSWORD)
    now = datetime.utcnow().isoformat()

    existing = cur.execute(
        "SELECT id FROM users WHERE username = ?",
        (USERNAME,)
    ).fetchone()

    if existing:
        user_id = existing[0]
        cur.execute(
            """
            UPDATE users
            SET email = ?, password_hash = ?, role = ?, updated_at = ?
            WHERE id = ?
            """,
            (EMAIL, hashed, ROLE, now, user_id)
        )
    else:
        cur.execute(
            """
            INSERT INTO users (username, email, password_hash, role, created_at, updated_at, is_banned, allowed_payment_methods, backup_codes)
            VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
            """,
            (USERNAME, EMAIL, hashed, ROLE, now, now, '["CASH","PAYPAL","INVOICE"]', "[]")
        )
        user_id = cur.lastrowid

    conn.commit()

    row = cur.execute(
        "SELECT id, username, role FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()
    print("ADMIN_USER:", row)

    conn.close()

if __name__ == "__main__":
    main()
