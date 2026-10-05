import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { AdminProvider } from './context/AdminContext';
import { CMSProvider } from './context/CMSContext';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Loading from './components/common/Loading';
import BottomNav from './components/layout/BottomNav';
import FloatingContact from './components/common/FloatingContact';

// Scroll window to top on route navigation
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname]);

  return null;
}

// Storefront entry pages (Home, Shop) ship in the main bundle; everything else is split
// so shoppers don't download the admin dashboard, maps and Firebase up front.
const CHUNK_RELOAD_KEY = 'cf_chunk_reload';

// After a redeploy, an open tab may request chunk files that no longer exist.
// Reload once to pick up the new build instead of showing an error screen.
const withReload = (loader) => () =>
  loader()
    .then((mod) => {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      return mod;
    })
    .catch((err) => {
      if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
        window.location.reload();
        return new Promise(() => {});
      }
      throw err;
    });

const importProductDetails = () => import('./pages/ProductDetails');
const importCart = () => import('./pages/Cart');
const importCheckout = () => import('./pages/Checkout');

const ProductDetails = lazy(withReload(importProductDetails));
const Cart = lazy(withReload(importCart));
const Checkout = lazy(withReload(importCheckout));
const Login = lazy(withReload(() => import('./pages/Login')));
const Profile = lazy(withReload(() => import('./pages/Profile')));
const AdminDashboard = lazy(withReload(() => import('./pages/admin/AdminDashboard')));

// Warm the most likely next pages once the browser is idle so navigation stays instant.
const usePrefetchRoutes = () => {
  useEffect(() => {
    const prefetch = () => {
      [importProductDetails, importCart, importCheckout].forEach((load) => load().catch(() => {}));
    };
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(prefetch, 2500);
    return () => clearTimeout(id);
  }, []);
};

function App() {
  usePrefetchRoutes();

  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminProvider>
          <CMSProvider>
            <CartProvider>
              <FavoritesProvider>
                <Router>
                  <ScrollToTop />
                  <ToastContainer position="top-right" autoClose={3000} />
                  <Suspense fallback={<Loading />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/product/:id" element={<ProductDetails />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/loading" element={<Loading />} />
                      
                      {/* Admin Routes */}
                      <Route path="/admin/*" element={<AdminDashboard />} />
                    </Routes>
                  </Suspense>
                  
                  {/* Floating Modern Contact Us Widget */}
                  <FloatingContact />

                  {/* Global Mobile Bottom Navigation Dock */}
                  <BottomNav />
                </Router>
              </FavoritesProvider>
            </CartProvider>
          </CMSProvider>
        </AdminProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
