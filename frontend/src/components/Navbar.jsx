import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Button from './Button';

const Navbar = () => {
  const { user, isAuthenticated, logout, openLoginModal, hasRole, withAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const { openCart, getTotalItems } = useCart();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasMerchantProfile, setHasMerchantProfile] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const checkMerchantProfile = async () => {
      if (!isAuthenticated() || !hasRole('merchant')) {
        setHasMerchantProfile(false);
        return;
      }

      try {
        const res = await fetch('http://127.0.0.1:8000/merchant/profile', {
          headers: withAuthHeaders()
        });
        setHasMerchantProfile(res.ok);
      } catch {
        setHasMerchantProfile(false);
      }
    };

    checkMerchantProfile();
  }, [user?.id]);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!isAuthenticated()) {
        setNotifications([]);
        return;
      }
      setNotifLoading(true);
      try {
        const res = await fetch('http://127.0.0.1:8000/notifications', {
          headers: withAuthHeaders()
        });
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error();
        setNotifications(Array.isArray(data) ? data : []);
      } catch {
        setNotifications([]);
      } finally {
        setNotifLoading(false);
      }
    };

    loadNotifications();
  }, [user?.id]);

  const shopMenuLabel = useMemo(() => (hasMerchantProfile ? 'Shop bearbeiten' : 'Shop erstellen'), [hasMerchantProfile]);
  const unreadCount = useMemo(
    () => (notifications || []).filter((n) => !n.is_read).length,
    [notifications]
  );

  const markAsRead = async (id) => {
    try {
      await fetch(`http://127.0.0.1:8000/notifications/${id}/read`, {
        method: 'PATCH',
        headers: withAuthHeaders()
      });
      setNotifications((prev) => prev.map((n) => (Number(n.id) === Number(id) ? { ...n, is_read: 1 } : n)));
    } catch {
      // noop
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('http://127.0.0.1:8000/notifications/read-all', {
        method: 'PATCH',
        headers: withAuthHeaders()
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch {
      // noop
    }
  };

  const handleNotificationClick = async (n) => {
    await markAsRead(n.id);
    setIsNotifOpen(false);
    if (n.link) {
      navigate(n.link);
    }
  };

  const renderNotifText = (n) => {
    if (n.message) return n.message;
    return 'Benachrichtigung';
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 py-4 relative z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo and site name */}
          <Link to="/" className="text-xl font-bold">
            B2B2C Marketplace
          </Link>

          {/* Right side: Cart and Auth */}
          <div className="flex items-center space-x-4">
            {isAuthenticated() && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen((p) => !p)}
                  className="bg-black text-white border border-zinc-800 px-3 py-2 rounded-lg hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-200 relative"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-black border border-zinc-800 rounded-lg shadow-lg z-50 max-h-96 overflow-auto">
                    <div className="px-4 py-2 border-b border-zinc-800 font-semibold flex items-center justify-between">
                      <span>Benachrichtigungen</span>
                      {notifications.length > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-zinc-300 hover:text-white"
                        >
                          Alle als gelesen markieren
                        </button>
                      )}
                    </div>
                    {notifLoading ? (
                      <div className="px-4 py-3 text-zinc-400 text-sm">Lade...</div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-3 text-zinc-400 text-sm">Keine Benachrichtigungen</div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`w-full text-left px-4 py-3 border-b border-zinc-900 hover:bg-zinc-900 ${n.is_read ? 'text-zinc-400' : 'text-white'}`}
                        >
                          <div className="text-sm">{renderNotifText(n)}</div>
                          <div className="text-xs text-zinc-500 mt-1">
                            {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Cart button - ONLY ONE global cart button */}
            <button
              onClick={openCart}
              className="bg-black text-white border border-zinc-800 px-3 py-2 rounded-lg hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-200 relative"
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-black text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {getTotalItems()}
                  </span>
                )}
              </span>
            </button>

            {/* Auth section - ONLY ONE profile dropdown/login button */}
            {isAuthenticated() ? (
              <div className="relative" ref={dropdownRef}>
                {/* User profile button */}
                <button
                  onClick={toggleDropdown}
                  className="bg-black text-white border border-zinc-800 px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-200 flex items-center"
                >
                  <span className="mr-2">{user.username}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown menu - Fixed z-index issue */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-black border border-zinc-800 rounded-lg shadow-lg z-50">
                    <ul>
                      {/* All users */}
                      <li>
                        <Link
                          to="/account"
                          className="block px-4 py-2 text-white hover:bg-zinc-900 first:rounded-t-lg"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Mein Konto
                        </Link>
                      </li>
                      
                      {/* Customer-specific */}
                      {hasRole('customer') && (
                        <li>
                          <Link
                            to="/my-orders"
                            className="block px-4 py-2 text-white hover:bg-zinc-900"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            Meine Bestellungen
                          </Link>
                        </li>
                      )}

                      <li>
                        <Link
                          to="/tickets"
                          className="block px-4 py-2 text-white hover:bg-zinc-900"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Tickets
                        </Link>
                      </li>

                      {/* Merchant-specific */}
                      {hasRole('merchant') && (
                        <>
                          <li>
                            <Link
                              to="/seller/shop-profile"
                              className="block px-4 py-2 text-white hover:bg-zinc-900"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              {shopMenuLabel}
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/seller/products"
                              className="block px-4 py-2 text-white hover:bg-zinc-900"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              Artikel verwalten
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/seller/sales"
                              className="block px-4 py-2 text-white hover:bg-zinc-900"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              Verkäufe einsehen
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/seller/analytics"
                              className="block px-4 py-2 text-white hover:bg-zinc-900"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              Analysen
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/seller/customers"
                              className="block px-4 py-2 text-white hover:bg-zinc-900"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              Kunden verwalten
                            </Link>
                          </li>
                        </>
                      )}

                      {/* Admin-only */}
                      {hasRole('admin') && (
                        <>
                          <li>
                            <Link
                              to="/admin/users"
                              className="block px-4 py-2 text-white hover:bg-zinc-900"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              Nutzerverwaltung
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/admin/settings"
                              className="block px-4 py-2 text-white hover:bg-zinc-900"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              Plattform-Einstellungen
                            </Link>
                          </li>
                        </>
                      )}

                      {/* Divider */}
                      <li className="border-t border-zinc-800 my-1"></li>

                      {/* Logout */}
                      <li>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-white hover:bg-zinc-900 rounded-b-lg"
                        >
                          Logout
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <Button onClick={openLoginModal}>
                Anmelden
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
