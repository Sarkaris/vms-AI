# Vercel Deployment with SQLite (Local Database)

Since you're using SQLite locally, here's how to deploy to Vercel with SQLite support.

## ⚠️ Important: SQLite Limitations on Vercel

**Problem:** Vercel serverless functions are **stateless** and **ephemeral**:
- Each function invocation gets a fresh environment
- In-memory SQLite (`:memory:`) **loses all data** between invocations
- File-based SQLite has **read-only filesystem** (except `/tmp` which is cleared)

## 🎯 Solutions for SQLite on Vercel

### Option 1: Turso (SQLite Cloud) - ⭐ RECOMMENDED

**Turso** is a serverless SQLite database - perfect for Vercel!

**Why Turso?**
- ✅ Free tier available
- ✅ SQLite compatible (same SQL)
- ✅ Serverless (works with Vercel)
- ✅ Fast and reliable
- ✅ No code changes needed (just connection string)

**Setup Steps:**

1. **Create Turso Account:**
   - Go to [turso.tech](https://turso.tech)
   - Sign up (free)
   - Create a new database

2. **Get Connection String:**
   - Copy the connection string from Turso dashboard
   - Format: `libsql://your-db-name.turso.io`

3. **Install Turso Client:**
   ```bash
   npm install @libsql/client
   ```

4. **Update Database Wrapper:**
   - See updated `server/utils/databaseWrapper.js` below

5. **Add to Vercel Environment Variables:**
   ```
   TURSO_DATABASE_URL=libsql://your-db-name.turso.io
   TURSO_AUTH_TOKEN=your-auth-token
   DEMO_DATABASE=turso
   DEMO_MODE=false
   ```

### Option 2: File-based SQLite with /tmp (Temporary)

**⚠️ Warning:** Data is lost on cold starts and function timeouts.

**Setup:**
```env
DEMO_DATABASE=sqlite
SQLITE_DB_PATH=/tmp/vms.db
```

**Limitations:**
- Data lost on cold starts
- Data lost after function timeout
- Not suitable for production

### Option 3: Use Demo Mode (In-Memory)

**For Testing Only:**
```env
DEMO_MODE=true
DEMO_DATABASE=sqlite
```

**Limitations:**
- Data resets on every cold start
- Read-only mode
- Not for production

### Option 4: Migrate to Cloud Database

**Best for Production:**
- **PlanetScale** (MySQL) - Free tier
- **Supabase** (PostgreSQL) - Free tier
- **Railway** (MySQL) - $5/month

---

## 🚀 Recommended: Turso Setup (SQLite Cloud)

### Step 1: Install Turso Client

Update `server/package.json`:
```json
{
  "dependencies": {
    "@libsql/client": "^0.11.0"
  }
}
```

### Step 2: Update Database Wrapper

I'll create an updated `databaseWrapper.js` that supports Turso.

### Step 3: Deploy to Vercel

1. Push code to GitHub
2. Deploy to Vercel
3. Add environment variables:
   ```
   TURSO_DATABASE_URL=libsql://your-db.turso.io
   TURSO_AUTH_TOKEN=your-token
   DEMO_DATABASE=turso
   DEMO_MODE=false
   ```

### Step 4: Run Database Schema

Use Turso CLI to run your schema:
```bash
turso db shell your-db-name < schema.sql
```

---

## 📝 Updated Files Needed

I'll create:
1. Updated `databaseWrapper.js` with Turso support
2. Updated `api/index.js` for Turso
3. Migration guide from local SQLite to Turso

---

## 🔄 Migration from Local SQLite

### Export Your Local Data

If you have data in local SQLite:

1. **Export to SQL:**
   ```bash
   sqlite3 your-local-db.db .dump > export.sql
   ```

2. **Import to Turso:**
   ```bash
   turso db shell your-db-name < export.sql
   ```

---

## 💡 Quick Start with Turso

```bash
# 1. Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# 2. Login
turso auth login

# 3. Create database
turso db create vms-db

# 4. Get connection info
turso db show vms-db

# 5. Run schema
turso db shell vms-db < schema.sql
```

---

## 🎯 Which Option Should You Choose?

| Option | Best For | Data Persistence | Cost |
|--------|----------|------------------|------|
| **Turso** | Production | ✅ Permanent | Free tier |
| File SQLite | Testing | ❌ Temporary | Free |
| Demo Mode | Demo | ❌ Resets | Free |
| Cloud MySQL | Production | ✅ Permanent | Free-$5/mo |

**Recommendation:** Use **Turso** - it's SQLite-compatible and works perfectly with Vercel!

---

## 📚 Next Steps

1. **Choose Turso** (recommended) or another option
2. **Update database wrapper** (I'll provide the code)
3. **Deploy to Vercel** with new environment variables
4. **Test** your deployment

Let me know which option you prefer, and I'll provide the exact code updates!

