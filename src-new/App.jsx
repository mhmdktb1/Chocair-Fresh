import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AdminProvider } from './context/AdminContext';
import { CMSProvider } from './context/CMSContext';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <AdminProvider>
      <CMSProvider>
        <CartProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              
              {/* Admin Routes */}
              <Route path="/admin/*" element={<AdminDashboard />} />
            </Routes>
          </Router>
        </CartProvider>
      </CMSProvider>
    </AdminProvider>
  );
}

export default App;
