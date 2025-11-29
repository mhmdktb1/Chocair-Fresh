# 🗄️ MongoDB Setup Guide - Fix Connection Error

## 🚨 Problem
```
❌ MongoDB Connection Failed: connect ECONNREFUSED ::1:27017
```

This means MongoDB is not running locally. You have **3 options**:

---

## ✅ **OPTION 1: MongoDB Atlas (Recommended - FREE Cloud Database)**

This is the **easiest solution** - no local installation needed!

### Steps:

1. **Go to MongoDB Atlas:**
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Click "Try Free" or "Sign Up"

2. **Create Account:**
   - Sign up with email or Google
   - Free forever (no credit card required)

3. **Create a Cluster:**
   - Click "Build a Database"
   - Choose **M0 FREE** tier
   - Select region closest to you (e.g., AWS / us-east-1)
   - Cluster name: `Cluster0` (default is fine)
   - Click "Create"

4. **Create Database User:**
   - Username: `chocairuser`
   - Password: `chocair123456` (or your own secure password)
   - Click "Create User"

5. **Whitelist Your IP:**
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - IP: `0.0.0.0/0`
   - Click "Confirm"

6. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Driver: Node.js
   - Version: 5.5 or later
   - Copy the connection string:
     ```
     mongodb+srv://chocairuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```

7. **Update `.env` file:**
   ```env
   MONGO_URI=mongodb+srv://chocairuser:chocair123456@cluster0.xxxxx.mongodb.net/chocair-fresh?retryWrites=true&w=majority
   ```
   
   **Replace:**
   - `<password>` with your actual password
   - `cluster0.xxxxx` with your actual cluster URL
   - Add `/chocair-fresh` before the `?` (database name)

8. **Restart Backend:**
   ```bash
   # The server will auto-restart with nodemon
   # Or manually restart:
   cd backend
   npm run dev
   ```

---

## ✅ **OPTION 2: Install MongoDB Locally (Windows)**

If you prefer running MongoDB on your machine:

### Steps:

1. **Download MongoDB:**
   - Visit: https://www.mongodb.com/try/download/community
   - Select: Windows, MSI installer
   - Click "Download"

2. **Install MongoDB:**
   - Run the `.msi` installer
   - Choose "Complete" installation
   - **Important:** Check "Install MongoDB as a Service"
   - Check "Install MongoDB Compass" (optional GUI)
   - Click "Install"

3. **Verify Installation:**
   ```powershell
   # Check if MongoDB service is running
   Get-Service -Name MongoDB
   
   # Should show: Status = Running
   ```

4. **Start MongoDB (if not running):**
   ```powershell
   # Start as service
   net start MongoDB
   
   # Or run manually:
   "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
   ```

5. **Create Data Directory:**
   ```powershell
   # Create directory if it doesn't exist
   mkdir C:\data\db
   ```

6. **Update `.env` to use local:**
   ```env
   MONGO_URI=mongodb://localhost:27017/chocair-fresh
   ```

7. **Restart Backend:**
   ```bash
   cd backend
   npm run dev
   ```

---

## ✅ **OPTION 3: Quick Test with Mock Data (No Database)**

For quick testing without database setup:

1. **Create a mock database module:**

```javascript
// backend/config/mockDB.js
const mockDB = {
  users: [],
  products: [],
  orders: []
};

export const connectMockDB = () => {
  console.log('✅ Using Mock Database (no MongoDB required)');
  return Promise.resolve();
};

export default mockDB;
```

2. **Update `server.js`:**

```javascript
// Comment out real DB connection
// import connectDB from './config/db.js';
// await connectDB();

// Use mock DB instead
import { connectMockDB } from './config/mockDB.js';
await connectMockDB();
```

**Note:** This is only for testing - data will be lost on restart!

---

## 🎯 **Recommended Solution: MongoDB Atlas**

**Why MongoDB Atlas?**
- ✅ FREE forever (up to 512MB)
- ✅ No installation needed
- ✅ Works from anywhere
- ✅ Automatic backups
- ✅ Easy to use
- ✅ Production-ready

**Time:** 5-10 minutes to set up

---

## 🐛 Common Issues

### Issue 1: "Authentication failed"
**Solution:** Check username and password in connection string

### Issue 2: "Connection timeout"
**Solution:** 
- Whitelist your IP in MongoDB Atlas (0.0.0.0/0 for all IPs)
- Check your internet connection

### Issue 3: "Database name not specified"
**Solution:** Add database name in connection string:
```
mongodb+srv://user:pass@cluster.net/DATABASE_NAME?retryWrites=true
```

### Issue 4: Local MongoDB won't start on Windows
**Solution:**
```powershell
# Check if port 27017 is in use
netstat -ano | findstr :27017

# Stop existing process if needed
taskkill /PID <process_id> /F

# Restart MongoDB service
net stop MongoDB
net start MongoDB
```

---

## 🧪 Test Your Connection

Once MongoDB is set up, test it:

```bash
# Backend terminal should show:
┌─────────────────────────────────────────┐
│ ✅ MongoDB Connected Successfully       │
│ Host: cluster0-shard-00-00.xxxxx        │
│ Database: chocair-fresh                 │
└─────────────────────────────────────────┘

╔════════════════════════════════════════╗
║   🥬 CHOCAIR FRESH API SERVER 🍓      ║
║                                        ║
║   Server running on port 5000        ║
║   Environment: development              ║
║   URL: http://localhost:5000         ║
║                                        ║
║   API Docs: http://localhost:5000/   ║
╚════════════════════════════════════════╝
```

Test endpoint:
```bash
# Open browser:
http://localhost:5000/api/test

# Should see:
{
  "message": "API running ✅",
  "timestamp": "2024-11-06T...",
  "environment": "development"
}
```

---

## 📝 Quick Setup Command Summary

### MongoDB Atlas (Recommended):
```bash
1. Sign up at https://cloud.mongodb.com
2. Create FREE cluster
3. Create user: chocairuser / chocair123456
4. Whitelist IP: 0.0.0.0/0
5. Get connection string
6. Update backend/.env with connection string
7. Restart: npm run dev
```

### Local MongoDB:
```powershell
1. Download: https://www.mongodb.com/try/download/community
2. Install with "Install as Service" checked
3. Verify: Get-Service -Name MongoDB
4. Start: net start MongoDB
5. Update .env: MONGO_URI=mongodb://localhost:27017/chocair-fresh
6. Restart: npm run dev
```

---

**Choose MongoDB Atlas** for the easiest setup! 🚀
