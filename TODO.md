# TODO - Rollen-Integrität Fix

- [x] Backend: Login-Rollenlogik auf DB-Role (Enum/Join) härten
- [x] Backend: User-Erstellung mit role_id/role-Wert robust und DB-korrekt speichern
- [x] Frontend: AuthContext Login-Rolle strikt aus API (`data.role`) übernehmen
- [x] Frontend: Logout vollständiger Reset (State + localStorage)
- [x] Frontend: ProtectedRoute für /admin gegen CUSTOMER/KUNDE erzwingen
- [ ] DB-Check Snippet erstellen (ID, Email, Role)
- [ ] Kurzvalidierung via statischer Codeprüfung
