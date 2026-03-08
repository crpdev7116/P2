from app.database import SessionLocal
from app import models


def main():
    db = SessionLocal()
    try:
        target_email = "admin@crp.com"
        user = db.query(models.User).filter(models.User.email == target_email).first()

        if not user:
            print(f"User not found: {target_email}")
            return

        user.two_factor_secret = None
        user.backup_codes = []
        db.commit()
        db.refresh(user)

        print("Emergency 2FA reset completed.")
        print(f"User: {user.email} (id={user.id})")
        print(f"two_factor_secret: {user.two_factor_secret}")
        print(f"backup_codes: {user.backup_codes}")
    except Exception as exc:
        db.rollback()
        print(f"Emergency 2FA reset failed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
