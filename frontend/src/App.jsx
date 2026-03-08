import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import MarketplaceHome from './pages/MarketplaceHome';
import ShopView from './pages/ShopView';
import AccountSettings from './pages/AccountSettings';
import UserManagement from './pages/UserManagement';
import AdminSettings from './pages/AdminSettings';
import MyOrders from './pages/MyOrders';
import Tickets from './pages/Tickets';
import NewTicket from './pages/tickets/NewTicket';
import TicketDetail from './pages/tickets/TicketDetail';
import ManageProducts from './pages/seller/ManageProducts';
import Sales from './pages/seller/Sales';
import Analytics from './pages/seller/Analytics';
import ManageCustomers from './pages/seller/ManageCustomers';
import ShopProfile from './pages/seller/ShopProfile';
import CompleteProfile from './pages/CompleteProfile';
import Cart from './components/CartOptimized';
import Auth from './components/Auth';
import Navbar from './components/Navbar';
import './App.css';

function ProtectedRoute({ children, requiredRole, allowAdminOverride = false }) {
  const { user, token, isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return null;
  }

  if (!isAuthenticated() || !token) {
    return <Navigate to="/login" replace />;
  }

  const userRole = String(user?.role || '').toUpperCase();
  const required = String(requiredRole || '').toUpperCase();

  if (required) {
    const allowed = userRole === required || (allowAdminOverride && userRole === 'ADMIN');
    if (!allowed) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

function RestrictedStateGuard() {
  const { user, token, isAuthenticated, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading || !isAuthenticated() || !token || !user || user.is_active !== false) {
    return null;
  }

  const allowed = (
    location.pathname === '/tickets' ||
    location.pathname === '/tickets/new' ||
    location.pathname.startsWith('/tickets/')
  );

  if (allowed) {
    return null;
  }

  return <Navigate to="/tickets" replace />;
}

function CompleteProfileGuard({ children }) {
  const { user, token, isAuthenticated, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading || !token || !user) return children;
  if (!isAuthenticated()) return children;

  const mustComplete = user.must_change_password === true || user.profile_complete === false;
  const onCompletePage = location.pathname === '/complete-profile';

  if (mustComplete && !onCompletePage) {
    return <Navigate to="/complete-profile" replace />;
  }
  return children;
}

function BannedGuard({ children }) {
  const { user, token, isAuthenticated, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading || !token || !user) return children;
  if (!isAuthenticated()) return children;
  if (!user.is_banned) return children;

  const ticketPaths = ['/tickets', '/tickets/new'];
  const onTicketPath = location.pathname === '/tickets' || location.pathname === '/tickets/new' || /^\/tickets\/\d+$/.test(location.pathname);
  if (onTicketPath) return children;

  return <Navigate to="/tickets" replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();
  const isRestricted = !!user && user.is_active === false;
  const showNavbar = location.pathname !== '/complete-profile';

  return (
    <>
      {isRestricted && (
        <div className="bg-red-600 text-white text-center p-3 font-bold z-50">⚠️ Dein Account ist aktuell eingeschränkt. Du kannst keine Käufe oder Verkäufe tätigen. Bitte eröffne ein Support-Ticket zur Klärung.</div>
      )}
      {showNavbar && <Navbar />}
      <Cart />
      <Auth />
      <RestrictedStateGuard />
      <BannedGuard>
      <CompleteProfileGuard>
      <Routes>
        <Route path="/" element={<MarketplaceHome />} />
        <Route path="/dashboard" element={<MarketplaceHome />} />
        <Route path="/login" element={<MarketplaceHome />} />
        <Route path="/account" element={<AccountSettings />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
        <Route path="/tickets/new" element={<NewTicket />} />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminSettings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/seller/shop-profile"
          element={
            <ProtectedRoute requiredRole="MERCHANT" allowAdminOverride={true}>
              <ShopProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/products"
          element={
            <ProtectedRoute requiredRole="MERCHANT" allowAdminOverride={true}>
              <ManageProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/sales"
          element={
            <ProtectedRoute requiredRole="MERCHANT" allowAdminOverride={true}>
              <Sales />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/analytics"
          element={
            <ProtectedRoute requiredRole="MERCHANT" allowAdminOverride={true}>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/customers"
          element={
            <ProtectedRoute requiredRole="MERCHANT" allowAdminOverride={true}>
              <ManageCustomers />
            </ProtectedRoute>
          }
        />

        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/:shopId" element={<ShopView />} />
      </Routes>
      </CompleteProfileGuard>
      </BannedGuard>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
