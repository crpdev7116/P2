import sqlite3

conn = sqlite3.connect("backend/marketplace.db")
cur = conn.cursor()

cur.execute(
    """
    UPDATE users
    SET two_factor_secret = NULL,
        backup_codes = '[]'
    WHERE email = 'admin@crp.com' OR username = 'admin'
    """
)

conn.commit()
print("✅ 2FA für Admin in DB deaktiviert!")
conn.close()
