# One-Pass Execution TODO

- [ ] Patch backend/app/main.py
  - [ ] Add TicketStatusUpdateRequest model
  - [ ] Add PATCH /tickets/{ticket_id}/status (ADMIN, MODERATOR only)
  - [ ] Ensure ticket status change creates notification for ticket owner
  - [ ] Add GET /merchants endpoint
  - [ ] Keep notifications endpoints aligned with required response fields

- [ ] Patch frontend/src/pages/tickets/NewTicket.jsx
  - [ ] Remove assigned target-user field from form and payload

- [ ] Patch frontend/src/App.jsx
  - [ ] Allow authenticated users to access /tickets/new

- [ ] Patch frontend/src/components/Navbar.jsx
  - [ ] Restrict admin menu links to ADMIN only
  - [ ] Add notification bell next to cart
  - [ ] Add unread counter badge
  - [ ] Load notifications and show dropdown
  - [ ] Mark notifications as read via PATCH

- [ ] Patch frontend/src/pages/seller/ShopProfile.jsx
  - [ ] Show create form when profile missing
  - [ ] Show storefront-style preview when profile exists
  - [ ] Add edit flow in modal/tab-like panel

- [ ] Patch frontend/src/pages/seller/ManageProducts.jsx
  - [ ] Professional tabbed layout (Kategorien / Artikel)
  - [ ] Ensure POST /items sends all required fields
  - [ ] Refresh item list immediately after create
  - [ ] Show success feedback after item creation

- [ ] Patch frontend/src/pages/MarketplaceHome.jsx
  - [ ] Switch merchant source to GET /merchants
  - [ ] Keep clean merchant grid

- [ ] Restart backend server (hard restart)

- [ ] Final verification sweep:
  - [ ] Moderator cannot see Nutzerverwaltung / Plattform Verwaltung
  - [ ] Notification bell rendered in Navbar
