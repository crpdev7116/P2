from datetime import datetime
import bcrypt
from sqlalchemy import text

from app.database import SessionLocal
from app import models


def hash_password(raw_password: str) -> str:
    return bcrypt.hashpw(raw_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def main():
    db = SessionLocal()
    try:
        # Delete all existing users
        db.query(models.User).delete()
        db.commit()

        pwd_hash = hash_password("123456")

        seed_users = [
            {
                "username": "admin",
                "email": "admin@crp.com",
                "role": models.UserRole.ADMIN,
                "first_name": "Admin",
                "last_name": "Root",
                "address": "HQ Street 1",
                "zip_code": "10000",
                "city": "Berlin",
                "date_of_birth": datetime(1990, 1, 1),
                "phone_number": "+49000000001",
            },
            {
                "username": "mod",
                "email": "mod@crp.com",
                "role": models.UserRole.MODERATOR,
                "first_name": "Mod",
                "last_name": "Guardian",
                "address": "Ops Street 2",
                "zip_code": "20000",
                "city": "Hamburg",
                "date_of_birth": datetime(1991, 2, 2),
                "phone_number": "+49000000002",
            },
            {
                "username": "seller",
                "email": "seller@crp.com",
                "role": models.UserRole.MERCHANT,
                "first_name": "Seller",
                "last_name": "Merchant",
                "address": "Shop Street 3",
                "zip_code": "30000",
                "city": "Munich",
                "date_of_birth": datetime(1992, 3, 3),
                "phone_number": "+49000000003",
            },
            {
                "username": "testuser",
                "email": "testuser@crp.com",
                "role": models.UserRole.CUSTOMER,
                "first_name": "Test",
                "last_name": "User",
                "address": "User Street 4",
                "zip_code": "40000",
                "city": "Cologne",
                "date_of_birth": datetime(1993, 4, 4),
                "phone_number": "+49000000004",
            },
        ]

        created_ids = []
        for data in seed_users:
            user = models.User(
                username=data["username"],
                email=data["email"],
                password_hash=pwd_hash,
                role=data["role"],
                first_name=data["first_name"],
                last_name=data["last_name"],
                address=data["address"],
                zip_code=data["zip_code"],
                city=data["city"],
                date_of_birth=data["date_of_birth"],
                phone_number=data["phone_number"],
                two_factor_secret=None,
                backup_codes=[],
                is_banned=False,
                allowed_payment_methods=["CASH", "PAYPAL", "INVOICE"],
            )
            db.add(user)
            db.flush()
            created_ids.append(user.id)

        db.commit()

        # Set is_active=True if column exists physically
        try:
            columns = db.execute(text("PRAGMA table_info(users)")).fetchall()
            has_is_active = any(str(col[1]).lower() == "is_active" for col in columns)
            if has_is_active and created_ids:
                id_csv = ",".join(str(i) for i in created_ids)
                db.execute(text(f"UPDATE users SET is_active = 1 WHERE id IN ({id_csv})"))
                db.commit()
        except Exception:
            db.rollback()

        print("Users reset complete.")
        for uid, u in zip(created_ids, seed_users):
            print(f"- id={uid} username={u['username']} email={u['email']} role={u['role'].value}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
