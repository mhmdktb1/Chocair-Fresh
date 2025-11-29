# 🔐 Authentication System - Complete Implementation Guide

## ✅ Implementation Summary

I've successfully implemented a **complete JWT-based authentication system** for Chocair Fresh. Here's what was built:

---

## 📁 Files Created/Updated

### ✅ **New Files Created:**

1. **`src/utils/api.js`** - Centralized API utility
   - Base URL configuration
   - Automatic Authorization header injection
   - JWT token management
   - Error handling wrapper
   - Token expiration checking

2. **`src/pages/Login.jsx`** - Email/Password login page
   - Controlled form with validation
   - Remember me option
   - Show/hide password toggle
   - Error/success messages
   - Redirect to intended route after login

3. **`src/pages/Register.jsx`** - New user registration
   - Full form validation
   - Password confirmation matching
   - Phone number input
   - Email format validation
   - Auto-redirect after success

4. **`src/components/PrivateRoute.jsx`** - Route protection
   - `PrivateRoute` - Requires authentication
   - `AdminRoute` - Requires admin role
   - `GuestRoute` - Only for non-authenticated users
   - Loading states
   - Redirect with state preservation

### ✅ **Files Updated:**

1. **`src/context/AuthContext.jsx`** - Enhanced authentication context
   - `registerUser()` - Register with backend API
   - `loginUser()` - Login with JWT token
   - `logoutUser()` - Clear session
   - `updateProfile()` - Update user info
   - Auto-authentication on page load
   - Token expiration handling
   - User state management

2. **`src/App.jsx`** - Routes configuration
   - Added `/login` and `/register` routes
   - Protected `/account`, `/checkout` routes
   - Admin route protection for `/admin/*`
   - Guest-only routes for auth pages

3. **`src/components/layout/Header.jsx`** - Navigation updates
   - Login/Register buttons when not authenticated
   - User account + logout when authenticated
   - Cart counter display
   - Mobile menu with auth options

4. **`src/styles/auth.css`** - Complete authentication styles
   - Login/Register form styling
   - Alert messages (success/error)
   - Loading spinner
   - Password toggle button
   - Responsive design

---

## 🚀 How It Works

### **1. Registration Flow**

```
User fills Register form
  ↓
Frontend validates input
  ↓
POST /api/users/register
  ↓
Backend creates user + hashes password
  ↓
Returns JWT token + user data
  ↓
Saved to localStorage (chocairToken + chocairUser)
  ↓
User logged in automatically
  ↓
Redirect to homepage
```

### **2. Login Flow**

```
User enters email + password
  ↓
POST /api/users/login
  ↓
Backend verifies credentials
  ↓
Returns JWT token + user data
  ↓
Token saved to localStorage
  ↓
AuthContext updates state
  ↓
Redirect to intended page or home
```

### **3. Auto-Authentication on Page Load**

```
App loads
  ↓
AuthContext checks localStorage for token
  ↓
If token exists, verify with GET /api/users/profile
  ↓
If valid → User logged in automatically
  ↓
If expired/invalid → Clear localStorage
```

### **4. Protected Routes**

```
User navigates to /account
  ↓
PrivateRoute checks isAuthenticated
  ↓
If yes → Render AccountPage
  ↓
If no → Redirect to /login (save intended route)
  ↓
After login → Redirect back to /account
```

---

## 🧪 Testing Instructions

### **Prerequisites:**
1. ✅ Backend running on `http://localhost:5000`
2. ✅ Frontend running on `http://localhost:5173`
3. ✅ MongoDB connected

---

### **Test 1: Register New User**

1. Navigate to: `http://localhost:5173/register`
2. Fill in the form:
   - **Name:** John Doe
   - **Email:** john@test.com
   - **Phone:** +961 70 123 456
   - **Password:** password123
   - **Confirm Password:** password123
3. Click **"Create Account"**

**Expected Results:**
- ✅ Green success message appears
- ✅ Redirected to homepage after 1.5 seconds
- ✅ Header shows "User Account" icon instead of "Log In"
- ✅ localStorage contains `chocairToken` and `chocairUser`

**Backend Verification:**
```bash
# Check terminal logs for:
POST /api/users/register 201 (Created)
```

---

### **Test 2: Login with Existing User**

1. Navigate to: `http://localhost:5173/login`
2. Enter credentials:
   - **Email:** john@test.com
   - **Password:** password123
3. Check "Remember me" (optional)
4. Click **"Sign In"**

**Expected Results:**
- ✅ Success message appears
- ✅ Redirected to homepage
- ✅ User is logged in
- ✅ Token saved in localStorage

**Backend Verification:**
```bash
POST /api/users/login 200 (OK)
```

---

### **Test 3: Invalid Login Credentials**

1. Go to `/login`
2. Enter:
   - **Email:** wrong@test.com
   - **Password:** wrongpassword
3. Click **"Sign In"**

**Expected Results:**
- ❌ Red error alert: "Invalid email or password"
- ❌ User NOT logged in
- ❌ No token saved

---

### **Test 4: Protected Route Access (Not Logged In)**

1. **Logout first** (if logged in)
2. Try to navigate to: `http://localhost:5173/account`

**Expected Results:**
- ✅ Automatically redirected to `/login`
- ✅ After login, redirected back to `/account`

---

### **Test 5: Protected Route Access (Logged In)**

1. **Login first**
2. Navigate to: `http://localhost:5173/account`

**Expected Results:**
- ✅ AccountPage renders successfully
- ✅ No redirect

---

### **Test 6: Admin Route Protection**

1. Login as regular user (not admin)
2. Try to access: `http://localhost:5173/admin`

**Expected Results:**
- ❌ Redirected to homepage
- ❌ Error message (optional): "You do not have permission"

**Create Admin User:**
```bash
# Use Postman/Thunder Client or test-api.rest
POST http://localhost:5000/api/users/register
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@chocair.com",
  "password": "admin123",
  "phone": "+961 70 999 888",
  "role": "admin"
}
```

Then login as admin and access `/admin` → Should work!

---

### **Test 7: Logout Functionality**

1. Login first
2. Click user account icon → **"Sign Out"** (or mobile menu)

**Expected Results:**
- ✅ Redirected to homepage
- ✅ Header shows "Log In" button again
- ✅ localStorage cleared (no token/user)
- ✅ Accessing `/account` redirects to login

---

### **Test 8: Auto-Authentication on Refresh**

1. Login to the site
2. Refresh the page (`F5` or `Ctrl+R`)

**Expected Results:**
- ✅ User remains logged in
- ✅ No redirect to login
- ✅ User data loaded from localStorage

---

### **Test 9: Token Expiration Handling**

1. Login to the site
2. Open DevTools → Application → Local Storage
3. Manually delete `chocairToken`
4. Try to access `/account`

**Expected Results:**
- ✅ Redirected to `/login`
- ✅ Must login again

---

### **Test 10: Form Validation**

**Register Page:**
- ❌ Empty fields → Error message
- ❌ Invalid email format → Error message
- ❌ Password < 6 characters → Error message
- ❌ Passwords don't match → Error message

**Login Page:**
- ❌ Empty email → Error message
- ❌ Empty password → Error message
- ❌ Invalid email format → Error message

---

## 🔑 LocalStorage Structure

After successful login/registration:

```javascript
// localStorage.getItem('chocairToken')
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// localStorage.getItem('chocairUser')
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@test.com",
  "phone": "+961 70 123 456",
  "role": "customer",
  "address": {...},
  "favorites": [],
  "isActive": true,
  "createdAt": "2024-11-06T10:30:00Z"
}
```

---

## 🛠️ Using Authentication in Components

### **Check if user is logged in:**

```jsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { isAuthenticated, user, isAdmin } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user.name}!</p>
      ) : (
        <p>Please log in</p>
      )}
      
      {isAdmin && <button>Admin Panel</button>}
    </div>
  );
}
```

### **Making authenticated API calls:**

```jsx
import { get, post } from '../utils/api';

// Get user profile
const profile = await get('/users/profile');

// Create order (token auto-included)
const order = await post('/orders', orderData);
```

### **Logout:**

```jsx
import { useAuth } from '../context/AuthContext';

function LogoutButton() {
  const { logoutUser } = useAuth();

  return (
    <button onClick={logoutUser}>
      Logout
    </button>
  );
}
```

---

## 🐛 Troubleshooting

### **Problem: "Network error" on login/register**

**Solution:**
- ✅ Ensure backend is running: `cd backend && npm run dev`
- ✅ Check API URL in `src/utils/api.js` (default: `http://localhost:5000/api`)
- ✅ Verify CORS is enabled in backend `server.js`

### **Problem: Token expired immediately after login**

**Solution:**
- ✅ Check JWT_SECRET in `backend/.env`
- ✅ Verify JWT_EXPIRE is set (default: 30d)
- ✅ Clear browser localStorage and try again

### **Problem: Redirected to login even when logged in**

**Solution:**
- ✅ Open DevTools → Console for errors
- ✅ Check if `chocairToken` exists in localStorage
- ✅ Verify token is not expired with `isTokenExpired()` in `api.js`

### **Problem: Cannot access admin routes**

**Solution:**
- ✅ Ensure user has `role: "admin"` in database
- ✅ Check `isAdmin` in AuthContext (should be true)
- ✅ Re-login after changing role in database

---

## 📊 API Endpoints Used

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/users/register` | No | Register new user |
| POST | `/api/users/login` | No | Login user |
| GET | `/api/users/profile` | Yes | Get logged-in user |
| PUT | `/api/users/profile` | Yes | Update profile |

---

## 🎯 Next Steps

1. **Test the complete flow** using the instructions above
2. **Connect real products to cart** - Update CartContext to use backend API
3. **Implement orders** - Save orders to backend when checkout is complete
4. **Add password reset** - Create forgot password flow
5. **Social login** - Integrate Google OAuth (optional)
6. **Email verification** - Add email confirmation flow (optional)

---

## ✅ Checklist

- [x] API utility created (`src/utils/api.js`)
- [x] AuthContext updated with backend integration
- [x] Login page created (`src/pages/Login.jsx`)
- [x] Register page created (`src/pages/Register.jsx`)
- [x] PrivateRoute component created
- [x] App.jsx routes configured
- [x] Header updated with auth buttons
- [x] CSS styling added for auth pages
- [x] Token management (save/load/clear)
- [x] Auto-authentication on page load
- [x] Protected routes working
- [x] Admin route protection
- [x] Guest-only routes (redirect if logged in)
- [x] Form validation
- [x] Error handling
- [x] Loading states
- [x] Remember me option
- [x] Password visibility toggle

---

## 🎉 Success!

Your **authentication system is fully implemented** and ready to test! 

Start your servers and test the complete flow:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd ..
npm run dev
```

Then open `http://localhost:5173` and test registration → login → protected routes → logout!

---

**Built with ❤️ for Chocair Fresh**
