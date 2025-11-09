# 🚀 Vercel Deployment with SQLite (Turso)

Perfect solution for deploying your local SQLite database to Vercel!

## ✅ What's Been Updated

### Code Changes
- ✅ **`server/utils/databaseWrapper.js`** - Now supports Turso (SQLite Cloud)
- ✅ **`api/index.js`** - Updated to detect and use Turso
- ✅ **`server/package.json`** - Added `@libsql/client` dependency

### Documentation
- ✅ **`TURSO_SETUP.md`** - Complete Turso setup guide
- ✅ **`VERCEL_SQLITE_DEPLOYMENT.md`** - Full deployment guide
- ✅ **`VERCEL_SQLITE_QUICK_START.md`** - Quick 5-minute guide

---

## 🎯 Quick Start (3 Steps)

### Step 1: Setup Turso Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash  # Mac/Linux
# OR for Windows PowerShell:
irm https://get.tur.so/install.ps1 | iex

# Login
turso auth login

# Create database
turso db create vms-db

# Get connection info
turso db show vms-db
```

**Save the URL and Auth Token!**

### Step 2: Run Database Schema

```bash
# Create schema.sql (see TURSO_SETUP.md for SQL)
turso db shell vms-db < schema.sql
```

### Step 3: Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add Turso support"
   git push
   ```

2. **Add Environment Variables in Vercel:**
   ```
   TURSO_DATABASE_URL=libsql://vms-db-xxxxx.turso.io
   TURSO_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   DEMO_DATABASE=turso
   DEMO_MODE=false
   NODE_ENV=production
   JWT_SECRET=your_secret_here
   SESSION_SECRET=your_secret_here
   ```

3. **Deploy!** Vercel will auto-deploy from GitHub.

---

## 📚 Documentation Guide

### Start Here:
👉 **`TURSO_SETUP.md`** - Complete Turso setup (recommended first)

### Then:
👉 **`VERCEL_SQLITE_QUICK_START.md`** - Quick deployment (5 min)

### For Details:
👉 **`VERCEL_SQLITE_DEPLOYMENT.md`** - Full guide with all options

---

## 💡 Why Turso?

| Feature | Local SQLite | Turso (SQLite Cloud) |
|---------|-------------|---------------------|
| **Works on Vercel** | ❌ No | ✅ Yes |
| **Data Persistence** | ❌ Lost on restart | ✅ Permanent |
| **Free Tier** | ✅ Yes | ✅ Yes |
| **SQL Compatibility** | ✅ SQLite | ✅ SQLite |
| **Code Changes** | - | ✅ Minimal |

**Turso = SQLite in the cloud!** Perfect for Vercel! 🚀

---

## 🔄 How It Works

1. **Local Development:** Uses SQLite (in-memory or file)
2. **Vercel Deployment:** Automatically uses Turso if environment variables are set
3. **Same SQL:** No SQL changes needed!
4. **Same Code:** Works with your existing code

The `databaseWrapper.js` automatically detects:
- **Turso** - If `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set
- **Local SQLite** - If `DEMO_DATABASE=sqlite` or no DB config
- **MySQL** - If `DB_HOST` or `MYSQL_URI` is set

---

## 🆘 Troubleshooting

### "Module not found: @libsql/client"
```bash
cd server
npm install @libsql/client
```

### "Database connection failed"
- Check environment variables in Vercel
- Verify: `turso db list`
- Test: `turso db shell vms-db`

### "Table doesn't exist"
- Run schema: `turso db shell vms-db < schema.sql`

---

## ✅ Next Steps

1. **Read:** `TURSO_SETUP.md` for complete setup
2. **Follow:** Step-by-step instructions
3. **Deploy:** To Vercel with Turso
4. **Test:** Your application

---

**Your SQLite database is now ready for Vercel! 🎉**

Start with `TURSO_SETUP.md` to get started!

