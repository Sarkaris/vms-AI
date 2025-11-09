# ⚡ Quick Deploy to Vercel - Copy & Paste Commands

## 🎯 Fastest Way to Deploy (Copy these commands)

### 1. Install Turso (PowerShell as Admin)

```powershell
irm https://get.tur.so/install.ps1 | iex
```

Close and reopen PowerShell, then:

```powershell
turso auth login
turso db create vms-db
turso db show vms-db
```

**Save the URL and Token!**

### 2. Create schema.sql file

Create `schema.sql` in your project root with the SQL from `DEPLOY_TO_VERCEL_NOW.md` Step 4.

Then run:
```powershell
turso db shell vms-db < schema.sql
```

### 3. Create Admin

```powershell
turso db shell vms-db
```

Paste:
```sql
INSERT INTO admins (username, email, password, firstName, lastName, role, department, isActive)
VALUES ('admin', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'Super Admin', 'IT', 1);
```

Type `.exit`

### 4. Push to GitHub

```powershell
git init
git add .
git commit -m "Vercel ready"
# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/vms.git
git push -u origin main
```

### 5. Deploy on Vercel

1. Go to vercel.com → Sign up with GitHub
2. Import your repository
3. Build settings:
   - Build: `cd client && npm install && npm run build`
   - Output: `client/build`
4. Add environment variables:
   - `TURSO_DATABASE_URL` = your Turso URL
   - `TURSO_AUTH_TOKEN` = your Turso token
   - `DEMO_DATABASE` = `turso`
   - `DEMO_MODE` = `false`
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = (generate: `openssl rand -base64 32`)
   - `SESSION_SECRET` = (generate: `openssl rand -base64 32`)
5. Click Deploy!

**Done!** 🚀

---

**For detailed steps, see `DEPLOY_TO_VERCEL_NOW.md`**

