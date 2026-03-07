import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
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

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          {/* Global components */}
          <Navbar />
          <Cart />
          <Auth />
          
          <Routes>
            {/* Home route - shows all merchants */}
            <Route path="/" element={<MarketplaceHome />} />
            
            {/* Account settings */}
            <Route path="/account" element={<AccountSettings />} />
            
            {/* Customer routes */}
            <Route path="/my-orders" element={<MyOrders />} />
            
            {/* Admin routes */}
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            
            {/* Dynamic shop route - shows individual shop based on shopId */}
            <Route path="/:shopId" element={<ShopView />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
