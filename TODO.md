# TODO - CRITICAL SYSTEM REPAIR & RESET

- [x] Backend: verify_password/get_password_hash auf direkte bcrypt-Logik (passlib-frei) abgesichert ✅
- [x] Backend: /login Debug-Prints für user_found und password_match hinzugefügt ✅
- [x] Frontend: Guard gegen /users/None/... in loginStep2 und useBackupCode hinzugefügt ✅
- [x] Frontend: Error-Handling verbessert (Backend detail-Meldung via setError) ✅
- [x] Backend: full_reset_admin.py erstellt (delete+recreate admin@crp.com mit ID=1, bcrypt, 2FA/backup reset) ✅
- [ ] 2FA Token Isolation (pre_auth darf keine geschützten Endpunkte nutzen) — Manuelle Verifizierung durch User ausstehend
- [ ] Backup-Code One-Time-Use (zweite Nutzung muss fehlschlagen) — Manuelle Verifizierung durch User ausstehend
