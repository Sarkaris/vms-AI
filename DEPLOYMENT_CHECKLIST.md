# ✅ Vercel Deployment Checklist

Follow this checklist step by step to deploy your VMS to Vercel.

## 📋 Pre-Deployment

- [ ] Code works locally
- [ ] GitHub account ready
- [ ] Vercel account ready (or will create)

## 🔧 Setup Turso Database

- [ ] Installed Turso CLI
  ```powershell
  irm https://get.tur.so/install.ps1 | iex
  ```

- [ ] Logged in to Turso
  ```powershell
  turso auth login
  ```

- [ ] Created database
  ```powershell
  turso db create vms-db
  ```

- [ ] Saved database URL and Auth Token

- [ ] Created tables
  ```powershell
  turso db shell vms-db < schema.sql
  ```

- [ ] Created admin user
  ```powershell
  turso db shell vms-db
  # Then paste INSERT statement
  ```

## 📤 Push to GitHub

- [ ] Initialized Git (if not done)
  ```powershell
  git init
  ```

- [ ] Added all files
  ```powershell
  git add .
  ```

- [ ] Committed
  ```powershell
  git commit -m "Ready for Vercel"
  ```

- [ ] Created GitHub repository

- [ ] Added remote
  ```powershell
  git remote add origin https://github.com/USERNAME/vms.git
  ```

- [ ] Pushed to GitHub
  ```powershell
  git push -u origin main
  ```

## 🚀 Deploy on Vercel

- [ ] Signed up/Logged in to Vercel

- [ ] Imported GitHub repository

- [ ] Configured build settings:
  - [ ] Build Command: `cd client && npm install && npm run build`
  - [ ] Output Directory: `client/build`

- [ ] Added environment variables:
  - [ ] `TURSO_DATABASE_URL`
  - [ ] `TURSO_AUTH_TOKEN`
  - [ ] `DEMO_DATABASE` = `turso`
  - [ ] `DEMO_MODE` = `false`
  - [ ] `NODE_ENV` = `production`
  - [ ] `JWT_SECRET` (generated)
  - [ ] `SESSION_SECRET` (generated)

- [ ] Clicked Deploy

- [ ] Waited for build to complete

## ✅ Post-Deployment

- [ ] Visited deployment URL

- [ ] Tested health endpoint
  - URL: `https://your-app.vercel.app/api/health`

- [ ] Tested login
  - Email: `admin@example.com`
  - Password: `password`

- [ ] Verified all features work

## 🎉 Done!

Your VMS is now live on Vercel!

---

**Need help?** Check `DEPLOY_TO_VERCEL_NOW.md` for detailed steps.

