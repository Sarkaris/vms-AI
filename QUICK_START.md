# VMS Quick Start Guide

Get your VMS up and running in 10 minutes!

## Prerequisites Check

```bash
# Check Node.js (need 16+)
node -v

# Check npm
npm -v

# Check if MySQL is installed (optional for demo mode)
mysql --version
```

---

## Option 1: Quick Demo Deployment (SQLite)

Perfect for testing - no database setup required!

```bash
# 1. Navigate to project
cd /path/to/V16

# 2. Setup server environment
cd server
cp .env.example .env
nano .env  # Set DEMO_MODE=true

# 3. Install dependencies
npm install

# 4. Build client
cd ../client
npm install
npm run build

# 5. Start server
cd ../server
npm start

# Access at: http://localhost:5000
# Login: demo / password (or 123 / 123)
```

---

## Option 2: Production Deployment (MySQL)

### Step 1: Run Setup Script

```bash
chmod +x setup.sh
./setup.sh
```

This will install:
- Node.js
- PM2
- MySQL (optional)
- Nginx (optional)

### Step 2: Configure Database

```bash
# Create database and user
sudo mysql -u root -p

# In MySQL:
CREATE DATABASE vms;
CREATE USER 'vms_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON vms.* TO 'vms_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Configure Environment

```bash
cd server
cp .env.example .env
nano .env
```

**Minimum required settings:**
```env
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=vms_user
DB_PASSWORD=your_password
DB_NAME=vms
JWT_SECRET=$(openssl rand -base64 32)
DEMO_MODE=false
```

### Step 4: Deploy

```bash
# Run deployment script
chmod +x deploy.sh
./deploy.sh
```

That's it! Your app should be running.

---

## Option 3: Manual Deployment

### 1. Install Dependencies

```bash
# Server
cd server
npm install --production

# Client
cd ../client
npm install
npm run build
```

### 2. Start with PM2

```bash
cd ..
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions
```

### 3. Verify

```bash
# Check status
pm2 status

# Check health
curl http://localhost:5000/api/health
```

---

## Common First-Time Issues

### Issue: "Cannot find module"
**Fix:** Run `npm install` in both client and server directories

### Issue: "Database connection failed"
**Fix:** 
- Check MySQL is running: `sudo systemctl status mysql`
- Verify credentials in `server/.env`
- Test connection: `mysql -u vms_user -p vms`

### Issue: "Port already in use"
**Fix:** 
- Find process: `sudo lsof -i :5000`
- Kill it: `sudo kill -9 <PID>`
- Or change port in `server/.env`

### Issue: "Build failed"
**Fix:**
- Check Node.js version: `node -v` (need 16+)
- Clear and reinstall: `rm -rf node_modules && npm install`

---

## Next Steps

1. **Access Application:**
   - Local: `http://localhost:5000`
   - Production: `https://yourdomain.com`

2. **Create Admin User:**
   ```bash
   cd server
   node scripts/createAdmin.js
   ```

3. **Setup Nginx** (for production):
   - See `DEPLOYMENT.md` for full Nginx setup
   - Copy `nginx.conf` to `/etc/nginx/sites-available/`

4. **Setup SSL:**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

---

## Quick Commands Reference

```bash
# Start/Stop
pm2 start vms-server
pm2 stop vms-server
pm2 restart vms-server

# Logs
pm2 logs vms-server

# Status
pm2 status

# Rebuild client
cd client && npm run build

# Database backup
mysqldump -u vms_user -p vms > backup.sql
```

---

## Need More Help?

- **Full Guide:** See `DEPLOYMENT.md`
- **Troubleshooting:** See `TROUBLESHOOTING.md`
- **Check Logs:** `pm2 logs vms-server`

---

**That's it! You're ready to go! 🚀**

