#!/usr/bin/env python3
"""
Datenbank komplett zurücksetzen (drop_all + create_all) für sofortiges Testen
ohne Alembic-Migrationen. Führt danach optional seed_users aus.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from app import models


def main():
    print("Datenbank wird zurückgesetzt …")
    models.Base.metadata.drop_all(bind=engine)
    print("  → Tabellen gelöscht.")
    models.Base.metadata.create_all(bind=engine)
    print("  → Tabellen neu erstellt.")
    print("\nFertig. Starte optional: python seed_users.py für Testbenutzer.")


if __name__ == "__main__":
    main()
