# Emergency Repair TODO

- [x] Analyze role/enum/bcrypt issue scope
- [x] Run DB repair script to uppercase all `users.role` values
- [ ] Update `backend/app/models.py` to set `User.role = Column(Enum(UserRole, native_enum=False), ...)`
- [ ] Update `backend/app/main.py` with robust `verify_password` handling for `str` and `bytes`
- [ ] Start backend server for critical-path tests
- [ ] Run critical-path check: admin login
- [ ] Run critical-path check: `POST /users/{user_id}/2fa/setup`
- [ ] Confirm final operational status
