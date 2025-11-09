# Turso Setup Guide (SQLite Cloud for Vercel)

Since you're using SQLite locally, **Turso** is the perfect solution for Vercel - it's SQLite-compatible and works seamlessly!

## 🎯 Why Turso?

- ✅ **Free tier** - Perfect for your needs
- ✅ **SQLite compatible** - Same SQL, minimal code changes
- ✅ **Serverless** - Works perfectly with Vercel
- ✅ **Fast** - Global edge network
- ✅ **Persistent** - Data never gets lost

## 📦 Step 1: Install Turso

### Install Turso CLI

**Windows (PowerShell):**
```powershell
irm https://get.tur.so/install.ps1 | iex
```

**Mac/Linux:**
```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

### Login to Turso

```bash
turso auth login
```

This will open your browser to authenticate.

## 🗄️ Step 2: Create Database

```bash
# Create a new database
turso db create vms-db

# List your databases
turso db list

# Get connection info
turso db show vms-db
```

You'll get:
- **Database URL**: `libsql://vms-db-xxxxx.turso.io`
- **Auth Token**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long token)

**Save these!** You'll need them for Vercel environment variables.

## 📝 Step 3: Run Database Schema

Create a file `schema.sql` with your tables:

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
```bash
turso db shell vms-db < schema.sql
```

Or run SQL directly:
```bash
turso db shell vms-db
# Then paste your SQL and press Enter
```

## 📦 Step 4: Install Turso Client

Add to `server/package.json`:

```json
{
  "dependencies": {
    "@libsql/client": "^0.11.0"
  }
}
```

Then install:
```bash
cd server
npm install @libsql/client
```

## 🔧 Step 5: Update Code

The `databaseWrapper.js` has already been updated to support Turso! It will automatically use Turso if these environment variables are set:

```env
TURSO_DATABASE_URL=libsql://vms-db-xxxxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚀 Step 6: Deploy to Vercel

### Add Environment Variables in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these variables:

```
TURSO_DATABASE_URL=libsql://vms-db-xxxxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DEMO_DATABASE=turso
DEMO_MODE=false
NODE_ENV=production
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
```

**Generate secrets:**
```bash
openssl rand -base64 32
```

### Deploy:

```bash
git add .
git commit -m "Add Turso support"
git push
```

Vercel will auto-deploy!

## 👤 Step 7: Create Admin User

```bash
turso db shell vms-db
```

Then run:
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

## 🔄 Step 8: Migrate Local Data (Optional)

If you have data in your local SQLite:

```bash
# Export from local SQLite
sqlite3 your-local-db.db .dump > export.sql

# Import to Turso
turso db shell vms-db < export.sql
```

## ✅ Done!

Your SQLite database is now running on Turso and deployed on Vercel!

Visit: `https://your-app.vercel.app`

---

## 🆘 Troubleshooting

### "Module not found: @libsql/client"
```bash
cd server
npm install @libsql/client
```

### "Database connection failed"
- Check `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in Vercel
- Verify database exists: `turso db list`
- Test connection: `turso db shell vms-db`

### "Table doesn't exist"
- Run schema: `turso db shell vms-db < schema.sql`

### "Auth token expired"
- Get new token: `turso db tokens create vms-db`
- Update in Vercel environment variables

---

## 💡 Useful Turso Commands

```bash
# List databases
turso db list

# Show database info
turso db show vms-db

# Open SQL shell
turso db shell vms-db

# Create auth token
turso db tokens create vms-db

# Delete database (careful!)
turso db destroy vms-db
```

---

**That's it! Your local SQLite is now running on Turso in the cloud! 🚀**

