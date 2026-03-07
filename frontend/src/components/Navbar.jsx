import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Button from './Button';

const Navbar = () => {
  const { user, isAuthenticated, logout, openLoginModal, hasRole } = useAuth();
  const { openCart, getTotalItems } = useCart();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle dropdown
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

                      {/* Merchant-specific */}
                      {hasRole('merchant') && (
                        <li>
                          <Link
                            to="/merchant-dashboard"
                            className="block px-4 py-2 text-white hover:bg-zinc-900"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            Mein Shop Dashboard
                          </Link>
                        </li>
                      )}

                      {/* Admin/Moderator-specific */}
                      {(hasRole('admin') || hasRole('moderator')) && (
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
