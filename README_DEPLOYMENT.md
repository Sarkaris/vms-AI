# VMS Deployment - Quick Reference

## 📋 Deployment Files Overview

This project includes comprehensive deployment files for hosting on a VPS/server:

### Core Files

1. **`DEPLOYMENT.md`** - Complete deployment guide with all steps
2. **`TROUBLESHOOTING.md`** - Error solutions and diagnostics
3. **`QUICK_START.md`** - Get started in 10 minutes
4. **`setup.sh`** - Automated server setup script
5. **`deploy.sh`** - Automated deployment script
6. **`ecosystem.config.js`** - PM2 process manager configuration
7. **`nginx.conf`** - Nginx reverse proxy configuration

### Configuration Files

- **`server/.env.example`** - Server environment variables template
- **`client/.env.example`** - Client environment variables template

---

## 🚀 Quick Deployment (3 Steps)

### 1. Initial Setup
```bash
chmod +x setup.sh
./setup.sh
```

### 2. Configure Environment
```bash
cd server
cp .env.example .env
nano .env  # Edit with your settings
```

### 3. Deploy
```bash
chmod +x deploy.sh
./deploy.sh
```

**Done!** Your application is now running.

---

## 📁 Project Structure

```
V16/
├── client/                 # React frontend
│   ├── build/            # Production build (generated)
│   ├── src/              # Source code
│   └── package.json
├── server/                # Node.js backend
│   ├── config/           # Configuration
│   ├── routes/           # API routes
│   ├── models/           # Database models
│   ├── middleware/       # Express middleware
│   ├── utils/            # Utilities
│   ├── index.js          # Server entry point
│   └── .env              # Environment variables (create this)
├── ecosystem.config.js   # PM2 configuration
├── nginx.conf            # Nginx configuration
├── setup.sh              # Server setup script
├── deploy.sh             # Deployment script
├── DEPLOYMENT.md         # Full deployment guide
├── TROUBLESHOOTING.md    # Troubleshooting guide
└── QUICK_START.md        # Quick start guide
```

---

## 🔧 Key Configuration

### Server Environment (.env)

**Required Variables:**
```env
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=vms_user
DB_PASSWORD=your_password
DB_NAME=vms
JWT_SECRET=your_secret_here
DEMO_MODE=false
```

**Domain Configuration:**
```env
DOMAIN=yourdomain.com
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com
```

### Database Setup

**MySQL (Production):**
```sql
CREATE DATABASE vms;
CREATE USER 'vms_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON vms.* TO 'vms_user'@'localhost';
FLUSH PRIVILEGES;
```

**SQLite (Demo Mode):**
- No setup needed, works automatically when `DEMO_MODE=true`

---

## 🌐 Nginx Setup

1. **Copy configuration:**
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/vms
   ```

2. **Edit domain:**
   ```bash
   sudo nano /etc/nginx/sites-available/vms
   # Replace 'yourdomain.com' with your domain
   ```

3. **Enable site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/vms /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## 🔒 SSL Setup

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 📊 Monitoring

### PM2 Commands
```bash
pm2 status              # Check status
pm2 logs vms-server     # View logs
pm2 monit               # Monitor resources
pm2 restart vms-server   # Restart
```

### Health Check
```bash
curl http://localhost:5000/api/health
# Or
curl https://yourdomain.com/api/health
```

---

## 🐛 Common Issues

### Application won't start
```bash
pm2 logs vms-server --lines 50
```

### Database connection failed
```bash
mysql -u vms_user -p vms  # Test connection
```

### 502 Bad Gateway
```bash
pm2 status  # Check if app is running
curl http://localhost:5000/api/health
```

### Build errors
```bash
cd client
rm -rf node_modules build
npm install
npm run build
```

**See `TROUBLESHOOTING.md` for detailed solutions.**

---

## 📝 Deployment Checklist

- [ ] Server updated (`sudo apt-get update && upgrade`)
- [ ] Node.js 16+ installed
- [ ] MySQL installed and configured
- [ ] Database and user created
- [ ] Environment variables configured
- [ ] Dependencies installed (`npm install`)
- [ ] Client built (`npm run build` in client/)
- [ ] Application started with PM2
- [ ] Nginx configured and running
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Health check passing
- [ ] Backups configured

---

## 🔄 Update/Upgrade Process

```bash
# 1. Pull latest code
git pull  # or upload new files

# 2. Update dependencies
cd server && npm install --production
cd ../client && npm install && npm run build

# 3. Restart application
pm2 restart vms-server

# 4. Verify
curl http://localhost:5000/api/health
```

---

## 💾 Backup

### Database Backup
```bash
mysqldump -u vms_user -p vms > backup_$(date +%Y%m%d).sql
```

### Full Backup
```bash
tar -czf vms_backup_$(date +%Y%m%d).tar.gz \
  /var/www/vms/server/.env \
  /var/www/vms/ecosystem.config.js \
  /var/www/vms/nginx.conf
```

---

## 📚 Documentation

- **Full Guide:** `DEPLOYMENT.md` - Complete step-by-step guide
- **Troubleshooting:** `TROUBLESHOOTING.md` - All error solutions
- **Quick Start:** `QUICK_START.md` - Get started fast

---

## 🆘 Need Help?

1. Check `TROUBLESHOOTING.md` for your error
2. Review logs: `pm2 logs vms-server`
3. Run diagnostic: Create and run `diagnose.sh` (see TROUBLESHOOTING.md)
4. Verify all configuration files

---

## ✅ Post-Deployment

After deployment, verify:

1. **Application is running:**
   ```bash
   pm2 status
   ```

2. **Health check works:**
   ```bash
   curl https://yourdomain.com/api/health
   ```

3. **Website loads:**
   - Visit `https://yourdomain.com` in browser

4. **Login works:**
   - Create admin user or use demo credentials

5. **SSL is valid:**
   - Check browser shows secure connection

---

**Ready to deploy? Start with `QUICK_START.md` or `DEPLOYMENT.md`!**

