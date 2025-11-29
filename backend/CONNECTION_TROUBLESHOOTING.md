# MongoDB Atlas Connection Troubleshooting

## Current Status: Connection Failed ❌

Your connection string looks correct, but the connection is failing. Here's a systematic checklist:

---

## ✅ Step 1: Verify Network Access (Most Common Issue)

**In MongoDB Atlas:**

1. Click on **"Network Access"** in the left sidebar
2. Check if there are any IP addresses listed
3. You should see either:
   - `0.0.0.0/0` (Access from anywhere) - **RECOMMENDED for development**
   - OR your current IP address

**If no IPs are listed or your IP is missing:**
1. Click **"Add IP Address"**
2. Click **"ALLOW ACCESS FROM ANYWHERE"**
3. Confirm with IP: `0.0.0.0/0`
4. Click **"Confirm"**
5. **Wait 1-2 minutes** for the change to take effect

---

## ✅ Step 2: Verify Database User Credentials

**In MongoDB Atlas:**

1. Click **"Database Access"** in the left sidebar
2. Verify user exists: `kotob149_db_user`
3. Check password - if unsure, **RESET IT**:
   - Click "Edit" on the user
   - Click "Edit Password"
   - Choose "Autogenerate Secure Password" OR set your own
   - **COPY THE NEW PASSWORD**
   - Click "Update User"

**Update your `.env` file with the new password:**
```env
MONGO_URI=mongodb+srv://kotob149_db_user:NEW_PASSWORD_HERE@cluster0.uqf70iy.mongodb.net/chocair-fresh?retryWrites=true&w=majority&appName=Cluster0
```

---

## ✅ Step 3: Use Alternative Connection String (If SRV fails)

Some networks block SRV DNS lookups. Try the **Standard Connection String** instead:

1. In Atlas, click **"Connect"** on your Cluster0
2. Choose **"Connect your application"**
3. Look for **"Connection String Only"** or standard format
4. Copy the full connection string (looks like this):

```
mongodb://cluster0-shard-00-00.uqf70iy.mongodb.net:27017,cluster0-shard-00-01.uqf70iy.mongodb.net:27017,cluster0-shard-00-02.uqf70iy.mongodb.net:27017/chocair-fresh?ssl=true&replicaSet=atlas-abc123-shard-0&authSource=admin&retryWrites=true&w=majority
```

Replace your MONGO_URI with this standard format.

---

## ✅ Step 4: Test from Command Line

Once you've verified Steps 1-3, test the connection:

```powershell
cd c:\Project\Finalproject\backend
node test-connection.js
```

You should see:
```
✅ SUCCESS! MongoDB Connected
   Host: cluster0-shard-00-00.uqf70iy.mongodb.net
   Database: chocair-fresh
```

---

## ✅ Step 5: Start Backend Server

Once test-connection.js succeeds:

```powershell
cd c:\Project\Finalproject\backend
npm run dev
```

You should see:
```
┌─────────────────────────────────────────┐
│ ✅ MongoDB Connected Successfully       │
│ Host: cluster0.uqf70iy.mongodb.net     │
│ Database: chocair-fresh                 │
└─────────────────────────────────────────┘
```

---

## 🔍 Quick Checklist

- [ ] Network Access has 0.0.0.0/0 listed (waited 1-2 min after adding)
- [ ] Database user `kotob149_db_user` exists and has password
- [ ] Password in .env matches exactly (no quotes, no semicolon)
- [ ] Tried both SRV and Standard connection strings
- [ ] Internet connection is working
- [ ] No corporate firewall blocking MongoDB Atlas

---

## 🆘 Still Not Working?

Share the **exact error message** from `node test-connection.js` and I'll provide specific guidance.

Common errors:
- `ENOTFOUND` → Network/DNS issue → Try standard connection string
- `Authentication failed` → Wrong username/password → Reset password in Atlas
- `IP not whitelisted` → Add 0.0.0.0/0 to Network Access
- `Timeout` → Firewall blocking MongoDB ports (27017) → Check firewall settings
