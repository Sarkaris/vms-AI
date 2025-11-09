# 🚀 Deploy to Vercel - Step by Step (Right Now!)

Follow these exact steps to deploy your VMS to Vercel. Your code will work exactly as it does locally!

## 📋 Prerequisites Check

Before starting, make sure you have:
- ✅ GitHub account
- ✅ Vercel account (we'll create if needed)
- ✅ Your code working locally

---

## Step 1: Install Turso CLI (SQLite Cloud)

Since you use SQLite locally, we'll use **Turso** (SQLite in the cloud) for Vercel.

### Windows (PowerShell - Run as Administrator):

```powershell
irm https://get.tur.so/install.ps1 | iex
```

### After Installation:

Close and reopen PowerShell, then verify:
```powershell
turso --version
```

---

## Step 2: Login to Turso

```powershell
turso auth login
```

This will open your browser. Login with GitHub/Google.

---

## Step 3: Create Turso Database

```powershell
turso db create vms-db
```

**Save the output!** You'll see:
- Database URL: `libsql://vms-db-xxxxx.turso.io`
- Auth Token: `eyJ...` (long token)

---

## Step 4: Create Database Tables

Create a file `schema.sql` in your project root with this content:

```sql
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Admin',
  department TEXT NOT NULL,
  permissions TEXT,
  isActive INTEGER NOT NULL DEFAULT 1,
  lastLogin TEXT,
  loginAttempts INTEGER NOT NULL DEFAULT 0,
  lockUntil TEXT,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT,
  purpose TEXT NOT NULL,
  expectedDuration INTEGER NOT NULL DEFAULT 60,
  checkInTime TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  checkOutTime TEXT,
  status TEXT NOT NULL DEFAULT 'Checked In',
  badgeId TEXT NOT NULL UNIQUE,
  qrCode TEXT,
  photo TEXT,
  aadhaarId TEXT,
  panId TEXT,
  passportId TEXT,
  drivingLicenseId TEXT,
  temperature REAL,
  healthDeclaration INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  location TEXT NOT NULL DEFAULT 'Main Lobby',
  isVip INTEGER NOT NULL DEFAULT 0,
  securityLevel TEXT NOT NULL DEFAULT 'Low',
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emergencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  incidentCode TEXT NOT NULL UNIQUE,
  departmentName TEXT,
  groupName TEXT,
  pocName TEXT,
  pocPhone TEXT,
  representativeIdDocument TEXT,
  representativeIdNumber TEXT,
  headcount INTEGER,
  visitorFirstName TEXT,
  visitorLastName TEXT,
  visitorPhone TEXT,
  reason TEXT,
  isMinor INTEGER NOT NULL DEFAULT 0,
  guardianContact TEXT,
  createdBy INTEGER,
  resolvedBy INTEGER,
  resolvedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Then run:
```powershell
turso db shell vms-db < schema.sql
```

---

## Step 5: Create Admin User

```powershell
turso db shell vms-db
```

Then paste this SQL and press Enter:

```sql
INSERT INTO admins (username, email, password, firstName, lastName, role, department, isActive)
VALUES (
  'admin',
  'admin@example.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Admin',
  'User',
  'Super Admin',
  'IT',
  1
);
```

**Default password:** `password`

Type `.exit` to leave the shell.

---

## Step 6: Get Turso Connection Info

```powershell
turso db show vms-db
```

**Copy these two values:**
- Database URL (looks like: `libsql://vms-db-xxxxx.turso.io`)
- Auth Token (long token starting with `eyJ...`)

---

## Step 7: Push Code to GitHub

### If you don't have Git initialized:

```powershell
git init
git add .
git commit -m "Ready for Vercel deployment"
```

### Create GitHub Repository:

1. Go to [github.com](https://github.com)
2. Click **New Repository**
3. Name it: `vms` (or any name)
4. **Don't** initialize with README
5. Click **Create repository**

### Push to GitHub:

```powershell
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/vms.git
git branch -M main
git push -u origin main
```

If asked for credentials, use a Personal Access Token (not password).

---

## Step 8: Deploy to Vercel

### Create Vercel Account:

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up**
3. Sign up with **GitHub** (recommended)

### Import Project:

1. In Vercel dashboard, click **Add New Project**
2. Click **Import** next to your GitHub repository
3. Vercel will auto-detect settings

### Configure Build Settings:

**Framework Preset:** Other (or leave blank)

**Root Directory:** `./` (leave as is)

**Build Command:** 
```
cd client && npm install && npm run build
```

**Output Directory:** 
```
client/build
```

**Install Command:** 
```
npm install
```

### Add Environment Variables:

Click **Environment Variables** and add these **ONE BY ONE**:

1. **TURSO_DATABASE_URL**
   - Value: `libsql://vms-db-xxxxx.turso.io` (from Step 6)

2. **TURSO_AUTH_TOKEN**
   - Value: `eyJ...` (from Step 6)

3. **DEMO_DATABASE**
   - Value: `turso`

4. **DEMO_MODE**
   - Value: `false`

5. **NODE_ENV**
   - Value: `production`

6. **JWT_SECRET**
   - Generate with: `openssl rand -base64 32`
   - Or use any random 32+ character string

7. **SESSION_SECRET**
   - Generate with: `openssl rand -base64 32`
   - Or use any random 32+ character string

**For each variable:**
- Check ✅ **Production**
- Check ✅ **Preview**
- Check ✅ **Development**

### Deploy:

Click **Deploy** button at the bottom!

Wait 2-5 minutes for build to complete.

---

## Step 9: Test Your Deployment

1. **Visit your site:**
   - URL will be: `https://your-project-name.vercel.app`
   - Or check Vercel dashboard for the URL

2. **Test health endpoint:**
   - Visit: `https://your-project-name.vercel.app/api/health`
   - Should show JSON with `status: "OK"`

3. **Login:**
   - Visit: `https://your-project-name.vercel.app/login`
   - Email: `admin@example.com`
   - Password: `password`

---

## ✅ Done!

Your VMS is now live on Vercel! 🎉

---

## 🆘 Troubleshooting

### Build Fails?

1. **Check Vercel logs:**
   - Go to Vercel Dashboard → Your Project → Deployments → Click latest → View Function Logs

2. **Common issues:**
   - Missing environment variables → Add them all
   - Build command wrong → Use: `cd client && npm install && npm run build`
   - Output directory wrong → Use: `client/build`

### Database Connection Fails?

1. **Check environment variables:**
   - Verify `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are correct
   - Check they're enabled for Production environment

2. **Test Turso connection:**
   ```powershell
   turso db shell vms-db
   # Should connect successfully
   ```

### Can't Login?

1. **Verify admin user exists:**
   ```powershell
   turso db shell vms-db
   SELECT * FROM admins;
   ```

2. **Create admin again if needed:**
   - Follow Step 5 again

---

## 📝 Quick Reference

**Your Vercel URL:** `https://your-project-name.vercel.app`

**Turso Database:** `vms-db`

**Admin Login:**
- Email: `admin@example.com`
- Password: `password`

**Update Code:**
```powershell
git add .
git commit -m "Update"
git push
# Vercel auto-deploys!
```

---

## 🎯 That's It!

Your VMS is now running on Vercel exactly as it works locally! 

**Need help?** Check the logs in Vercel dashboard or ask me!

