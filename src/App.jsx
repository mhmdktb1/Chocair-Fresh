import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { AdminProvider } from "./context/AdminContext";
import { CMSProvider } from "./context/CMSContext";
import Home from "./pages/Home";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import ProductPage from "./pages/ProductPage";
import AccountPage from "./pages/AccountPage";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import SignIn from "./pages/SignIn";
import Login from "./pages/Login";
import LoginPhone from "./pages/LoginPhone";
import Register from "./pages/Register";
import OrderSuccess from "./pages/OrderSuccess";
import UserOrders from "./pages/user/UserOrders";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PrivateRoute, { AdminRoute, GuestRoute } from "./components/PrivateRoute";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          <AdminProvider>
            <CMSProvider>
              <Router>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/product/:id" element={<ProductPage />} />
                  
                  {/* Guest-Only Routes (redirect to home if authenticated) */}
                  <Route 
                    path="/login" 
                    element={
                      <GuestRoute>
                        <Login />
                      </GuestRoute>
                    } 
                  />
                  <Route 
                    path="/login-phone" 
                    element={
                      <GuestRoute>
                        <LoginPhone />
                      </GuestRoute>
                    } 
                  />
                  <Route 
                    path="/register" 
                    element={
                      <GuestRoute>
                        <Register />
                      </GuestRoute>
                    } 
                  />
                  <Route 
                    path="/signin" 
                    element={
                      <GuestRoute>
                        <SignIn />
                      </GuestRoute>
                    } 
                  />
                  
                  {/* Protected Routes (require authentication) */}
                  <Route 
                    path="/account" 
                    element={
                      <PrivateRoute>
                        <AccountPage />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <PrivateRoute>
                        <AccountPage />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/checkout" 
                    element={<Checkout />} 
                  />
                  <Route 
                    path="/order-success" 
                    element={<OrderSuccess />} 
                  />
                  <Route 
                    path="/my-orders" 
                    element={
                      <PrivateRoute>
                        <UserOrders />
                      </PrivateRoute>
                    } 
                  />
                  
                  {/* Cart can be public or protected - keeping it public for now */}
                  <Route path="/cart" element={<Cart />} />
                  
                  {/* Admin Routes (Public for now) */}
                  <Route 
                    path="/admin/*" 
                    element={<AdminDashboard />} 
                  />
                </Routes>
              </Router>
            </CMSProvider>
          </AdminProvider>
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
