# VMS Deployment on Vercel - Complete Guide

This guide covers deploying your Visitor Management System (VMS) to Vercel, a serverless platform perfect for React + Node.js applications.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Vercel Account Setup](#vercel-account-setup)
3. [Project Preparation](#project-preparation)
4. [Database Setup](#database-setup)
5. [Environment Variables](#environment-variables)
6. [Deployment Steps](#deployment-steps)
7. [Post-Deployment](#post-deployment)
8. [Important Limitations](#important-limitations)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- ✅ **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
- ✅ **GitHub/GitLab/Bitbucket Account** - For code repository
- ✅ **Database Provider** - One of:
  - **PlanetScale** (MySQL - Recommended for Vercel)
  - **Railway** (MySQL)
  - **Supabase** (PostgreSQL)
  - **MongoDB Atlas** (MongoDB)
  - **Any external MySQL/PostgreSQL database**

### Required Tools
- Git installed
- Node.js 16+ installed locally (for testing)

---

## Vercel Account Setup

### Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (recommended) or email
3. Verify your email if required

### Step 2: Install Vercel CLI (Optional but Recommended)

```bash
npm install -g vercel
```

Login to Vercel:
```bash
vercel login
```

---

## Project Preparation

### Step 1: Update Package.json

Ensure your root `package.json` has a build script:

```json
{
  "scripts": {
    "build": "cd client && npm install && npm run build"
  }
}
```

### Step 2: Verify Project Structure

Your project should have:
```
V16/
├── api/
│   └── index.js          # Vercel serverless function
├── server/               # Backend code
├── client/               # React frontend
├── vercel.json           # Vercel configuration
└── package.json
```

### Step 3: Update Client Build Configuration

The client build is already configured. Verify `client/package.json` has:

```json
{
  "scripts": {
    "build": "react-scripts build"
  }
}
```

---

## Database Setup

### Option 1: PlanetScale (Recommended for MySQL)

**Why PlanetScale?**
- Serverless MySQL
- Free tier available
- Perfect for Vercel
- No connection limits

**Setup Steps:**

1. **Create PlanetScale Account:**
   - Go to [planetscale.com](https://planetscale.com)
   - Sign up with GitHub
   - Create a new database

2. **Get Connection String:**
   - Go to your database dashboard
   - Click "Connect"
   - Copy the connection string
   - Format: `mysql://username:password@host:port/database`

3. **Run Database Schema:**
   - Use PlanetScale CLI or web console
   - Run the SQL from `server/utils/db.js` (ensureSchema function)

### Option 2: Railway (MySQL)

1. Go to [railway.app](https://railway.app)
2. Create new project
3. Add MySQL service
4. Get connection string from variables

### Option 3: Supabase (PostgreSQL)

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings > Database

### Option 4: External MySQL Server

If you have your own MySQL server:

1. Ensure it's accessible from the internet
2. Whitelist Vercel IPs (or allow all for testing)
3. Use connection string format:
   ```
   mysql://user:password@host:port/database
   ```

### Database Schema Setup

For MySQL databases, you need to create the tables. The schema is in `server/utils/db.js`. 

**Quick Setup Script:**

Create a file `setup-database.sql`:

```sql
CREATE DATABASE IF NOT EXISTS vms;
USE vms;

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

Run this SQL in your database console.

---

## Environment Variables

### Step 1: Required Environment Variables

Set these in Vercel Dashboard → Your Project → Settings → Environment Variables:

```env
# Server Configuration
NODE_ENV=production

# Database Configuration
DB_HOST=your-db-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=vms

# Or use connection string (recommended)
MYSQL_URI=mysql://user:password@host:port/database
# OR
DATABASE_URL=mysql://user:password@host:port/database

# JWT Secret (IMPORTANT: Generate a strong secret)
JWT_SECRET=your_super_secret_jwt_key_min_32_characters

# Demo Mode (set to false for production)
DEMO_MODE=false
DEMO_DATABASE=mysql

# CORS (optional - Vercel handles this automatically)
ALLOWED_ORIGINS=https://your-app.vercel.app

# Session Secret
SESSION_SECRET=your_session_secret_here
```

### Step 2: Generate Secrets

```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate Session Secret
openssl rand -base64 32
```

### Step 3: Add to Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: `JWT_SECRET`
   - **Value**: (paste generated secret)
   - **Environment**: Production, Preview, Development (select all)
4. Repeat for all variables

---

## Deployment Steps

### Method 1: Deploy via Vercel Dashboard (Easiest)

#### Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - Vercel ready"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/vms.git
git push -u origin main
```

#### Step 2: Import to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Add New Project**
3. Import your GitHub repository
4. Vercel will auto-detect settings:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (root)
   - **Build Command**: `cd client && npm install && npm run build`
   - **Output Directory**: `client/build`

#### Step 3: Configure Build Settings

In Vercel project settings:

**Build & Development Settings:**
- **Framework Preset**: Other
- **Build Command**: `cd client && npm install && npm run build`
- **Output Directory**: `client/build`
- **Install Command**: `npm install` (or leave empty)

**Environment Variables:**
- Add all environment variables from the list above

#### Step 4: Deploy

1. Click **Deploy**
2. Wait for build to complete (2-5 minutes)
3. Your app will be live at `https://your-app.vercel.app`

### Method 2: Deploy via Vercel CLI

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login

```bash
vercel login
```

#### Step 3: Deploy

```bash
# From project root
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? vms (or your choice)
# - Directory? ./
# - Override settings? No
```

#### Step 4: Add Environment Variables

```bash
# Add environment variables
vercel env add JWT_SECRET
vercel env add DB_HOST
vercel env add DB_USER
vercel env add DB_PASSWORD
vercel env add DB_NAME
# ... add all required variables

# For each variable, select environments:
# - Production
# - Preview  
# - Development
```

#### Step 5: Redeploy with Environment Variables

```bash
vercel --prod
```

---

## Post-Deployment

### Step 1: Verify Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Check health endpoint: `https://your-app.vercel.app/api/health`
3. Should return JSON with `status: "OK"`

### Step 2: Create Admin User

Since Socket.io doesn't work on Vercel, you'll need to create an admin user manually.

**Option A: Use Database Console**

```sql
INSERT INTO admins (username, email, password, firstName, lastName, role, department, isActive)
VALUES (
  'admin',
  'admin@example.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
  'Admin',
  'User',
  'Super Admin',
  'IT',
  1
);
```

**Option B: Create API Endpoint (Temporary)**

Add a temporary endpoint in `server/routes/auth.js`:

```javascript
// TEMPORARY: Remove after creating admin
router.post('/create-admin', async (req, res) => {
  // Add password protection here
  const { username, email, password, firstName, lastName } = req.body;
  // ... create admin logic
});
```

**Option C: Use Demo Mode**

Set `DEMO_MODE=true` in environment variables to use demo credentials:
- Username: `demo` / Password: `password`
- Username: `123` / Password: `123`

### Step 3: Test Application

1. **Login:**
   - Visit `https://your-app.vercel.app/login`
   - Use admin credentials

2. **Test Features:**
   - Dashboard loads
   - Visitors page works
   - Check-in works
   - Analytics works

3. **Check Logs:**
   - Go to Vercel Dashboard → Your Project → Logs
   - Check for any errors

### Step 4: Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. SSL certificate is automatically provisioned

---

## Important Limitations

### ⚠️ Socket.io (WebSocket) Not Supported

**Problem:** Vercel doesn't support WebSocket connections natively.

**Solutions:**

1. **Use Polling (Recommended):**
   - Socket.io will automatically fall back to polling
   - Already configured in `client/src/contexts/SocketContext.js`
   - Real-time updates will work via HTTP polling

2. **Disable Real-time Features:**
   - Remove Socket.io if not critical
   - Use regular API polling instead

3. **Use External WebSocket Service:**
   - **Pusher** - [pusher.com](https://pusher.com)
   - **Ably** - [ably.com](https://ably.com)
   - **Socket.io Cloud** - [socket.io/cloud](https://socket.io/cloud)

### ⚠️ Function Timeout

- **Free Tier:** 10 seconds max
- **Pro Tier:** 60 seconds max
- **Enterprise:** Custom limits

**Solution:** Optimize database queries and use connection pooling.

### ⚠️ Cold Starts

- First request after inactivity may be slow (1-3 seconds)
- Subsequent requests are fast
- Use Vercel Pro for better performance

### ⚠️ Database Connections

- Serverless functions create new connections
- Use connection pooling (PlanetScale handles this)
- Or use serverless-compatible databases

---

## Troubleshooting

### Error: "Module not found"

**Solution:**
```bash
# Ensure all dependencies are in package.json
cd server && npm install
cd ../client && npm install
```

### Error: "Database connection failed"

**Solutions:**
1. Check environment variables in Vercel dashboard
2. Verify database is accessible from internet
3. Check database credentials
4. For PlanetScale, ensure connection string is correct

### Error: "Build failed"

**Solutions:**
1. Check build logs in Vercel dashboard
2. Ensure Node.js version is 16+
3. Check for missing dependencies
4. Verify build command is correct

### Error: "CORS error"

**Solution:**
- Vercel handles CORS automatically
- If issues persist, check `ALLOWED_ORIGINS` environment variable

### Error: "Function timeout"

**Solutions:**
1. Optimize database queries
2. Use indexes on database
3. Implement caching
4. Upgrade to Vercel Pro

### Error: "Socket.io connection failed"

**Solution:**
- This is expected on Vercel
- Socket.io will use polling automatically
- Real-time features will still work via HTTP polling

---

## Database Connection String Examples

### PlanetScale
```
mysql://username:password@aws.connect.psdb.cloud/database?sslaccept=strict
```

### Railway
```
mysql://user:password@containers-us-west-xxx.railway.app:3306/railway
```

### Supabase (PostgreSQL)
```
postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

### Custom MySQL Server
```
mysql://user:password@your-server.com:3306/vms
```

---

## Quick Deployment Checklist

- [ ] Vercel account created
- [ ] Database provider selected and configured
- [ ] Database schema created
- [ ] Environment variables added to Vercel
- [ ] Code pushed to GitHub
- [ ] Project imported to Vercel
- [ ] Build settings configured
- [ ] Deployment successful
- [ ] Health check passing
- [ ] Admin user created
- [ ] Application tested
- [ ] Custom domain configured (optional)

---

## Cost Estimation

### Vercel Free Tier
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ 100 serverless function invocations/day
- ✅ Perfect for small to medium apps

### Vercel Pro ($20/month)
- ✅ Unlimited bandwidth
- ✅ Unlimited function invocations
- ✅ Better performance
- ✅ Team collaboration

### Database Costs
- **PlanetScale:** Free tier available
- **Railway:** $5/month minimum
- **Supabase:** Free tier available
- **Custom MySQL:** Varies

---

## Support & Resources

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Vercel Community:** [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **PlanetScale Docs:** [planetscale.com/docs](https://planetscale.com/docs)

---

**Your VMS is now ready to deploy on Vercel! 🚀**

Start with the deployment steps above, and refer to troubleshooting if you encounter any issues.

