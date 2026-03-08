import sqlite3
import bcrypt
from datetime import datetime

DB_PATH = "backend/marketplace.db"

ADMIN_ID = 1
ADMIN_USERNAME = "admin"
ADMIN_EMAIL = "admin@crp.com"
ADMIN_PASSWORD = "CRP_Admin_2026!"
ADMIN_ROLE = "ADMIN"


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    try:
        now = datetime.utcnow().isoformat()
        password_hash = get_password_hash(ADMIN_PASSWORD)

        # 1) Delete old admin by email (if exists)
        deleted_count = cur.execute(
            "DELETE FROM users WHERE email = ?",
            (ADMIN_EMAIL,)
        ).rowcount
        print(f"[RESET] Deleted existing users with email {ADMIN_EMAIL}: {deleted_count}")

        # 2) Ensure ID=1 can be reused by removing current occupant if different user exists
        existing_id_user = cur.execute(
            "SELECT id, email FROM users WHERE id = ?",
            (ADMIN_ID,)
        ).fetchone()

        if existing_id_user:
            cur.execute("DELETE FROM users WHERE id = ?", (ADMIN_ID,))
            print(f"[RESET] Removed existing user at ID={ADMIN_ID}: {existing_id_user}")

        # 3) Insert fresh admin with required fields and bcrypt hash
        cur.execute(
            """
            INSERT INTO users (
                id,
                username,
                email,
                password_hash,
                role,
                created_at,
                updated_at,
                profile_picture_url,
                two_factor_secret,
                backup_codes,
                is_banned,
                allowed_payment_methods
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                ADMIN_ID,
                ADMIN_USERNAME,
                ADMIN_EMAIL,
                password_hash,
                ADMIN_ROLE,
                now,
                now,
                None,
                None,
                "[]",
                0,
                '["CASH","PAYPAL","INVOICE"]'
            )
        )

        conn.commit()

        created = cur.execute(
            """
            SELECT id, username, email, role, two_factor_secret, backup_codes
            FROM users
            WHERE id = ?
            """,
            (ADMIN_ID,)
        ).fetchone()

        print("[RESET] Admin recreated successfully:", created)
        print("SYSTEM STABILIZED & ADMIN RESET READY")
    except Exception as exc:
        conn.rollback()
        print(f"[RESET][ERROR] {exc}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
