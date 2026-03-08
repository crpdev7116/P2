import sqlite3

DB_PATH = "backend/marketplace.db"

REQUIRED_COLUMNS = {
    "first_name": 'VARCHAR(100) NOT NULL DEFAULT ""',
    "last_name": 'VARCHAR(100) NOT NULL DEFAULT ""',
    "address": 'VARCHAR(255) NOT NULL DEFAULT ""',
    "zip_code": 'VARCHAR(20) NOT NULL DEFAULT ""',
    "city": 'VARCHAR(100) NOT NULL DEFAULT ""',
    "date_of_birth": 'DATETIME NOT NULL DEFAULT "1970-01-01 00:00:00"',
    "phone_number": 'VARCHAR(30) NOT NULL DEFAULT ""',
}


def get_existing_columns(cursor):
    rows = cursor.execute("PRAGMA table_info(users)").fetchall()
    return {row[1] for row in rows}


def migrate():
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.cursor()
        existing = get_existing_columns(cursor)

        for column, definition in REQUIRED_COLUMNS.items():
            if column not in existing:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {column} {definition}")
                print(f"[MIGRATE] added column: {column}")
            else:
                print(f"[MIGRATE] column exists: {column}")

        conn.commit()
        final_cols = get_existing_columns(cursor)
        missing = [col for col in REQUIRED_COLUMNS if col not in final_cols]
        if missing:
            raise RuntimeError(f"Migration incomplete. Missing columns: {missing}")

        print("[MIGRATE] users table schema synced successfully.")
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
