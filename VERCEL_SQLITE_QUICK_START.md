# Vercel + SQLite Quick Start (Turso)

Deploy your SQLite-based VMS to Vercel using Turso (SQLite Cloud) in 5 minutes!

## 🚀 Quick Setup

### Step 1: Create Turso Database (Free)

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database
turso db create vms-db

# Get connection info
turso db show vms-db
```

You'll get:
- Database URL: `libsql://vms-db-xxxxx.turso.io`
- Auth Token: `eyJ...` (long token)

### Step 2: Update Package.json

Add to `server/package.json`:
```json
{
  "dependencies": {
    "@libsql/client": "^0.11.0"
  }
}
```

### Step 3: Update Database Wrapper

Replace `server/utils/databaseWrapper.js` with the Turso version (I'll provide it).

### Step 4: Run Database Schema

```bash
# Create schema file from your tables
# Then run:
turso db shell vms-db < schema.sql
```

Or use the SQL from `server/utils/db.js` (ensureSchema function).

### Step 5: Deploy to Vercel

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
   JWT_SECRET=your_jwt_secret_here
   SESSION_SECRET=your_session_secret_here
   ```

3. **Deploy:**
   - Go to Vercel dashboard
   - Your project will auto-deploy
   - Or run: `vercel --prod`

### Step 6: Create Admin User

```bash
# Using Turso CLI
turso db shell vms-db

# Then run:
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

## ✅ Done!

Your SQLite database is now running on Turso and deployed on Vercel!

Visit: `https://your-app.vercel.app`

---

## 🔄 Migrate Local Data

If you have local SQLite data:

```bash
# Export from local SQLite
sqlite3 your-local-db.db .dump > export.sql

# Import to Turso
turso db shell vms-db < export.sql
```

---

## 💡 Why Turso?

- ✅ **Free tier** - Perfect for small apps
- ✅ **SQLite compatible** - Same SQL, no code changes
- ✅ **Serverless** - Works with Vercel
- ✅ **Fast** - Global edge network
- ✅ **Reliable** - Data persists permanently

---

## 🆘 Troubleshooting

### "Module not found: @libsql/client"
- Run `npm install` in server directory
- Ensure it's in `server/package.json`

### "Database connection failed"
- Check `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
- Verify database exists: `turso db list`

### "Table doesn't exist"
- Run schema: `turso db shell vms-db < schema.sql`

---

**Need the updated databaseWrapper.js? Let me know!**

