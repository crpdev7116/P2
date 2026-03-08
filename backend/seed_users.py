#!/usr/bin/env python3
"""
Database-Seeding-Skript für Standard-Testbenutzer.

1. Tabula Rasa: Löscht zuerst alle bestehenden Benutzer (und referenzierte Daten),
   damit alte Einträge mit ungültigen E-Mails (z. B. @test.local) entfernt werden
   und GET /users nicht mehr an Pydantic EmailStr-Validierung scheitert.
2. Legt danach die 4 Standard-Benutzer mit gültigen E-Mails (@test.com) und
   gehashten Passwörtern an.
"""
import sys
import os

# Backend-Root als Python-Pfad hinzufügen
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bcrypt

from app.database import SessionLocal, engine
from app import models


def get_password_hash(password: str) -> str:
    """Gleiche Logik wie in app.main – bcrypt, damit der normale Login-Flow funktioniert."""
    return bcrypt.hashpw(
        str(password).encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")


# Standard-Testbenutzer: (Rolle, Benutzername, E-Mail, Passwort-Klartext)
# E-Mail mit gültiger TLD (@test.com), da Pydantic .local als reserved ablehnt
SEED_USERS = [
    (models.UserRole.ADMIN, "admin", "admin@test.com", "123456"),
    (models.UserRole.MERCHANT, "seller", "seller@test.com", "123456"),
    (models.UserRole.MODERATOR, "mod", "mod@test.com", "123456"),
    (models.UserRole.CUSTOMER, "testuser", "testuser@test.com", "123456"),
]


def delete_all_users(db):
    """
    Entfernt alle User. Zuerst werden abhängige Tabellen bereinigt (FK-Konformität),
    dann alle User gelöscht.
    """
    # Reihenfolge: zuerst Tabellen mit NOT NULL user_id, dann nullable FKs auf NULL setzen
    deleted_messages = db.query(models.TicketMessage).delete()
    deleted_tickets = db.query(models.Ticket).delete()
    deleted_notifications = db.query(models.Notification).delete()
    db.query(models.CustomPrice).delete()

    db.query(models.Merchant).update({models.Merchant.user_id: None})
    db.query(models.Customer).update({models.Customer.user_id: None})
    db.query(models.Category).update({models.Category.seller_id: None})

    deleted_users = db.query(models.User).delete()
    db.commit()
    return deleted_users


def main():
    print("Starte Seeding der Standard-Testbenutzer …")
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Tabula Rasa: alle bestehenden User (und Abhängigkeiten) löschen
        deleted = delete_all_users(db)
        if deleted > 0:
            print(f"  → {deleted} bestehende Benutzer gelöscht (sauberer Zustand).")

        # 2. Vier Standard-Benutzer mit gültigen E-Mails und gehashten Passwörtern anlegen
        for role, username, email, plain_password in SEED_USERS:
            password_hash = get_password_hash(plain_password)
            user = models.User(
                username=username,
                email=email,
                password_hash=password_hash,
                role=role,
                is_banned=False,
                allowed_payment_methods=["CASH", "PAYPAL", "INVOICE"],
            )
            db.add(user)
            role_label = role.value if hasattr(role, "value") else str(role)
            print(f"  ✓ {role_label}-Benutzer '{username}' angelegt ({email}).")

        db.commit()
        print("\nFertig. Datenbank wurde zurückgesetzt und 4 Standard-Benutzer angelegt.")
    except Exception as e:
        db.rollback()
        print(f"\nFehler: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
