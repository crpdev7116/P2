# Emergency Repair TODO

- [x] Analyze role/enum/bcrypt issue scope
- [x] Run DB repair script to uppercase all `users.role` values
- [x] Update `backend/app/models.py` to set `User.role = Column(Enum(UserRole, native_enum=False), ...)`
- [x] Update `backend/app/main.py` with robust login/password handling
- [x] Start backend server for critical-path tests
- [x] Run critical-path check: admin login
- [x] Run critical-path check: `POST /users/{user_id}/2fa/setup`
- [x] Confirm operational status

## 2FA Ghost Fix
- [x] Update `backend/app/main.py` login response to include `has2FA`
- [x] Create and run `backend/reset_2fa_admin.py` to clear admin `two_factor_secret`
- [x] Remove `mockUsers` and `simulateApiCall` from `frontend/src/context/AuthContext.jsx`
- [x] Update `loginStep1` flow: if `has2FA` true -> step2, else direct login
- [x] Verify admin login proceeds without 2FA block

## 2FA Backup-Management & Persistenz
- [ ] Extend backend `/users/{user_id}/2fa/verify` response with persisted `backup_codes`
- [ ] Add backend endpoints: get backup codes, regenerate backup codes, disable 2FA
- [ ] Update AdminPage success screen: hide QR after verify and show prominent backup-code warning
- [ ] Update AuthContext with `updateUser2FAState` and apply after successful verify
- [ ] Extend AccountSettings with 2FA management actions (show/regenerate/disable)
- [ ] Run minimal API verification for new 2FA management endpoints
