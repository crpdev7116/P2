import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import MarketplaceHome from './pages/MarketplaceHome';
import ShopView from './pages/ShopView';
import AccountSettings from './pages/AccountSettings';
import UserManagement from './pages/UserManagement';
import AdminSettings from './pages/AdminSettings';
import MyOrders from './pages/MyOrders';
import Cart from './components/CartOptimized';
import Auth from './components/Auth';
import Navbar from './components/Navbar';
import './App.css';

function ProtectedRoute({ children, requiredRole }) {
  const { user, isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return null;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const userRole = String(user?.role || '').toUpperCase();
  const required = String(requiredRole || '').toUpperCase();

  if (required && userRole !== required) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Cart />
      <Auth />

      <Routes>
        <Route path="/" element={<MarketplaceHome />} />
        <Route path="/dashboard" element={<MarketplaceHome />} />
        <Route path="/login" element={<MarketplaceHome />} />
        <Route path="/account" element={<AccountSettings />} />
        <Route path="/my-orders" element={<MyOrders />} />

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

        <Route path="/:shopId" element={<ShopView />} />
      </Routes>
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
