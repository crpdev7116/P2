import sqlite3
from passlib.context import CryptContext

DB_PATH = "backend/marketplace.db"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

row = cur.execute(
    "SELECT id, username, email, password_hash, role FROM users WHERE email=?",
    ("admin@crp.com",),
).fetchone()

print("ROW:", row)

if row:
    pwd_hash = row[3]
    print("VERIFY_ADMIN_PASSWORD:", pwd_context.verify("CRP_Admin_2026!", pwd_hash))
    print("VERIFY_WRONG_PASSWORD:", pwd_context.verify("wrong", pwd_hash))

conn.close()
