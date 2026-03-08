from sqlalchemy import create_engine, text

engine = create_engine("sqlite:///backend/marketplace.db")

commands = [
    "ALTER TABLE items ADD COLUMN discount_percentage FLOAT DEFAULT 0.0",
    "ALTER TABLE items ADD COLUMN fixed_discount_price FLOAT",
]

with engine.connect() as conn:
    for cmd in commands:
        try:
            conn.execute(text(cmd))
            conn.commit()
            print("OK:", cmd)
        except Exception as exc:
            conn.rollback()
            print("SKIP:", cmd, "->", str(exc).splitlines()[0])
