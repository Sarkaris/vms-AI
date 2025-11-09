# Vercel Deployment - Quick Start Guide

Get your VMS deployed on Vercel in 5 minutes!

## Prerequisites

- ✅ Vercel account ([vercel.com](https://vercel.com))
- ✅ GitHub account
- ✅ Database (PlanetScale, Railway, or any MySQL)

---

## Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Vercel deployment ready"
git remote add origin https://github.com/yourusername/vms.git
git push -u origin main
```

---

## Step 2: Setup Database

### Option A: PlanetScale (Recommended - Free)

1. Go to [planetscale.com](https://planetscale.com)
2. Sign up and create database
3. Copy connection string

### Option B: Railway

1. Go to [railway.app](https://railway.app)
2. Create project → Add MySQL
3. Copy connection string

---

## Step 3: Deploy to Vercel

### Via Dashboard (Easiest)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Add New Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Build Command**: `cd client && npm install && npm run build`
   - **Output Directory**: `client/build`
5. Add Environment Variables (see below)
6. Click **Deploy**

### Via CLI

```bash
npm install -g vercel
vercel login
vercel
```

---

## Step 4: Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```env
NODE_ENV=production
MYSQL_URI=mysql://user:password@host:port/database
JWT_SECRET=your_secret_here
SESSION_SECRET=your_secret_here
DEMO_MODE=false
DEMO_DATABASE=mysql
```

**Generate secrets:**
```bash
openssl rand -base64 32
```

---

## Step 5: Setup Database Schema

Run this SQL in your database console:

```sql
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  role ENUM('Super Admin','Admin','Security','Receptionist') NOT NULL DEFAULT 'Admin',
  department VARCHAR(100) NOT NULL,
  permissions JSON NULL,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  lastLogin DATETIME NULL,
  loginAttempts INT NOT NULL DEFAULT 0,
  lockUntil DATETIME NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  company VARCHAR(255) NULL,
  purpose VARCHAR(255) NOT NULL,
  expectedDuration INT NOT NULL DEFAULT 60,
  checkInTime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  checkOutTime DATETIME NULL,
  status ENUM('Checked In','Checked Out','Expired') NOT NULL DEFAULT 'Checked In',
  badgeId VARCHAR(64) NOT NULL UNIQUE,
  qrCode TEXT NULL,
  photo TEXT NULL,
  aadhaarId VARCHAR(32) NULL,
  panId VARCHAR(16) NULL,
  passportId VARCHAR(16) NULL,
  drivingLicenseId VARCHAR(32) NULL,
  temperature DECIMAL(5,2) NULL,
  healthDeclaration TINYINT(1) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  location VARCHAR(100) NOT NULL DEFAULT 'Main Lobby',
  isVip TINYINT(1) NOT NULL DEFAULT 0,
  securityLevel ENUM('Low','Medium','High') NOT NULL DEFAULT 'Low',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_checkInTime (checkInTime),
  INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS emergencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('Departmental','Visitor') NOT NULL,
  location VARCHAR(255) NULL,
  notes TEXT NULL,
  status ENUM('Active','Resolved','Cancelled') NOT NULL DEFAULT 'Active',
  incidentCode VARCHAR(64) NOT NULL UNIQUE,
  departmentName VARCHAR(255) NULL,
  groupName VARCHAR(255) NULL,
  pocName VARCHAR(255) NULL,
  pocPhone VARCHAR(20) NULL,
  representativeIdDocument VARCHAR(64) NULL,
  representativeIdNumber VARCHAR(128) NULL,
  headcount INT NULL,
  visitorFirstName VARCHAR(100) NULL,
  visitorLastName VARCHAR(100) NULL,
  visitorPhone VARCHAR(20) NULL,
  reason VARCHAR(255) NULL,
  isMinor TINYINT(1) NOT NULL DEFAULT 0,
  guardianContact VARCHAR(255) NULL,
  createdBy INT NULL,
  resolvedBy INT NULL,
  resolvedAt DATETIME NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type_status_createdAt (type, status, createdAt),
  INDEX idx_location_createdAt (location, createdAt)
);
```

---

## Step 6: Create Admin User

Run in your database console:

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

---

## Step 7: Test

1. Visit: `https://your-app.vercel.app`
2. Health check: `https://your-app.vercel.app/api/health`
3. Login: `https://your-app.vercel.app/login`
   - Email: `admin@example.com`
   - Password: `password`

---

## ✅ Done!

Your VMS is now live on Vercel! 🚀

---

## Need Help?

- **Full Guide:** See `VERCEL_DEPLOYMENT.md`
- **Environment Variables:** See `vercel-env-template.md`
- **Troubleshooting:** Check Vercel logs in dashboard

---

## Important Notes

⚠️ **Socket.io:** Vercel doesn't support WebSockets. Socket.io will automatically use HTTP polling, so real-time features still work!

⚠️ **Cold Starts:** First request may take 1-3 seconds. Subsequent requests are fast.

⚠️ **Database:** Use PlanetScale or Railway for best compatibility with Vercel.

