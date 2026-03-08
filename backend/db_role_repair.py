import sqlite3

DB_PATH = "backend/marketplace.db"

def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    before = cur.execute(
        "SELECT role, COUNT(1) FROM users GROUP BY role ORDER BY role"
    ).fetchall()
    print("BEFORE:", before)

    cur.execute("UPDATE users SET role = UPPER(role)")
    cur.execute("UPDATE users SET role='ADMIN' WHERE LOWER(role)='admin' OR role='ADMIN'")
    conn.commit()

    after = cur.execute(
        "SELECT role, COUNT(1) FROM users GROUP BY role ORDER BY role"
    ).fetchall()
    print("AFTER:", after)

    non_upper = cur.execute(
        "SELECT COUNT(1) FROM users WHERE role != UPPER(role)"
    ).fetchone()[0]
    print("NON_UPPERCASE_ROWS:", non_upper)

    conn.close()

if __name__ == "__main__":
    main()
