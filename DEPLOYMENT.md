# VMS Deployment Guide - Complete Production Setup

This comprehensive guide covers deploying the Visitor Management System (VMS) to a production server with zero errors and all edge cases handled.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Requirements](#server-requirements)
3. [Initial Server Setup](#initial-server-setup)
4. [Database Setup](#database-setup)
5. [Application Deployment](#application-deployment)
6. [Nginx Configuration](#nginx-configuration)
7. [SSL/HTTPS Setup](#sslhttps-setup)
8. [PM2 Process Management](#pm2-process-management)
9. [Firewall Configuration](#firewall-configuration)
10. [Monitoring & Logging](#monitoring--logging)
11. [Troubleshooting](#troubleshooting)
12. [Common Errors & Solutions](#common-errors--solutions)
13. [Backup & Recovery](#backup--recovery)
14. [Security Checklist](#security-checklist)

---

## Prerequisites

### Required Software
- **Node.js**: Version 16.0.0 or higher
- **npm**: Version 7.0.0 or higher (comes with Node.js)
- **MySQL**: Version 5.7+ or 8.0+ (for production) OR SQLite (for demo mode)
- **Nginx**: Latest stable version (recommended)
- **PM2**: Process manager for Node.js
- **Git**: For cloning/updating the repository

### Server Specifications (Minimum)
- **CPU**: 2 cores
- **RAM**: 2GB (4GB recommended)
- **Storage**: 20GB free space
- **OS**: Ubuntu 20.04 LTS / 22.04 LTS, CentOS 7+, or Debian 10+

### Domain & DNS
- A registered domain name
- DNS A record pointing to your server's IP address
- (Optional) A record for www subdomain

---

## Server Requirements

### 1. Update System Packages

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 2. Install Essential Tools

```bash
# Ubuntu/Debian
sudo apt-get install -y curl wget git build-essential

# CentOS/RHEL
sudo yum install -y curl wget git gcc gcc-c++ make
```

---

## Initial Server Setup

### Option 1: Automated Setup (Recommended)

Run the automated setup script:

```bash
chmod +x setup.sh
./setup.sh
```

This script will:
- Update system packages
- Install Node.js 18.x
- Install PM2 globally
- Install MySQL (optional)
- Install Nginx (optional)
- Install Certbot for SSL (optional)
- Configure firewall
- Create necessary directories
- Generate .env template

### Option 2: Manual Setup

Follow the manual steps in the [Manual Setup Guide](#manual-setup-guide) section.

---

## Database Setup

### MySQL Setup (Production)

#### 1. Install MySQL

```bash
# Ubuntu/Debian
sudo apt-get install -y mysql-server

# CentOS/RHEL
sudo yum install -y mysql-server
```

#### 2. Secure MySQL Installation

```bash
sudo mysql_secure_installation
```

Follow the prompts to:
- Set root password
- Remove anonymous users
- Disallow root login remotely
- Remove test database
- Reload privilege tables

#### 3. Create Database and User

```bash
sudo mysql -u root -p
```

Then run these SQL commands:

```sql
-- Create database
CREATE DATABASE vms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (replace 'secure_password' with a strong password)
CREATE USER 'vms_user'@'localhost' IDENTIFIED BY 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON vms.* TO 'vms_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Exit
EXIT;
```

#### 4. Test Connection

```bash
mysql -u vms_user -p vms
```

If successful, you'll see the MySQL prompt. Type `EXIT;` to leave.

### SQLite Setup (Demo Mode)

If using demo mode, SQLite will be used automatically. No additional setup required.

---

## Application Deployment

### Step 1: Clone/Upload Project

If using Git:

```bash
git clone <your-repo-url> /var/www/vms
cd /var/www/vms
```

Or upload your project files to `/var/www/vms` using SFTP/SCP.

### Step 2: Configure Environment Variables

```bash
cd /var/www/vms/server
cp .env.example .env
nano .env
```

**Critical Configuration Values:**

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Domain Configuration (REPLACE WITH YOUR DOMAIN)
DOMAIN=yourdomain.com
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=vms_user
DB_PASSWORD=your_secure_password_here
DB_NAME=vms

# JWT Secret (GENERATE A RANDOM STRING - MIN 32 CHARACTERS)
JWT_SECRET=$(openssl rand -base64 32)

# Demo Mode (set to false for production)
DEMO_MODE=false
DEMO_DATABASE=mysql

# Session Secret (GENERATE A RANDOM STRING)
SESSION_SECRET=$(openssl rand -base64 32)
```

**Generate Secure Secrets:**

```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate Session Secret
openssl rand -base64 32
```

### Step 3: Install Dependencies

```bash
# Install server dependencies
cd /var/www/vms/server
npm install --production

# Install client dependencies and build
cd /var/www/vms/client
npm install
npm run build
```

### Step 4: Verify Build

```bash
# Check if build directory exists
ls -la /var/www/vms/client/build

# Should see index.html and static/ directory
```

### Step 5: Test Database Connection

```bash
cd /var/www/vms/server
node -e "
require('dotenv').config();
const mysql = require('mysql2/promise');
(async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'vms'
        });
        await connection.end();
        console.log('✓ Database connection successful');
        process.exit(0);
    } catch (err) {
        console.error('✗ Database connection failed:', err.message);
        process.exit(1);
    }
})();
"
```

### Step 6: Deploy with PM2

#### Option A: Automated Deployment

```bash
cd /var/www/vms
chmod +x deploy.sh
./deploy.sh
```

#### Option B: Manual PM2 Deployment

```bash
cd /var/www/vms

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions shown (usually requires sudo)
```

### Step 7: Verify Application is Running

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs vms-server

# Test API endpoint
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "demoMode": false,
  "memory": {...},
  "uptime": "10 seconds"
}
```

---

## Nginx Configuration

### Step 1: Install Nginx

```bash
# Ubuntu/Debian
sudo apt-get install -y nginx

# CentOS/RHEL
sudo yum install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 2: Configure Nginx

```bash
# Copy the nginx configuration
sudo cp /var/www/vms/nginx.conf /etc/nginx/sites-available/vms

# Edit the configuration file
sudo nano /etc/nginx/sites-available/vms
```

**IMPORTANT:** Replace `yourdomain.com` with your actual domain name in the configuration file.

### Step 3: Enable Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/vms /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

### Step 4: Update File Permissions

```bash
# Set proper ownership
sudo chown -R www-data:www-data /var/www/vms/client/build

# Set proper permissions
sudo chmod -R 755 /var/www/vms/client/build
```

### Step 5: Test Nginx

```bash
# Test HTTP connection
curl http://yourdomain.com/api/health

# Check Nginx logs
sudo tail -f /var/log/nginx/vms-access.log
sudo tail -f /var/log/nginx/vms-error.log
```

---

## SSL/HTTPS Setup

### Step 1: Install Certbot

```bash
# Ubuntu/Debian
sudo apt-get install -y certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install -y certbot python3-certbot-nginx
```

### Step 2: Obtain SSL Certificate

```bash
# Get certificate and auto-configure Nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

### Step 3: Test Auto-Renewal

```bash
# Test renewal process
sudo certbot renew --dry-run

# Certbot automatically sets up renewal, but verify:
sudo systemctl status certbot.timer
```

### Step 4: Verify SSL

Visit `https://yourdomain.com` in your browser. You should see a secure connection.

---

## PM2 Process Management

### Useful PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs vms-server

# View specific number of lines
pm2 logs vms-server --lines 100

# Restart application
pm2 restart vms-server

# Stop application
pm2 stop vms-server

# Start application
pm2 start vms-server

# Delete application from PM2
pm2 delete vms-server

# Monitor (real-time)
pm2 monit

# Save current process list
pm2 save

# View process info
pm2 show vms-server
```

### PM2 Auto-Start on Boot

```bash
# Generate startup script
pm2 startup

# Follow the command shown (usually requires sudo)
# Example: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username

# Save current process list
pm2 save
```

---

## Firewall Configuration

### UFW (Ubuntu/Debian)

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### firewalld (CentOS/RHEL)

```bash
# Allow services
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# Reload firewall
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
```

---

## Monitoring & Logging

### Application Logs

```bash
# PM2 logs
pm2 logs vms-server

# Application-specific logs
tail -f /var/www/vms/logs/pm2-error.log
tail -f /var/www/vms/logs/pm2-out.log
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/vms-access.log

# Error logs
sudo tail -f /var/log/nginx/vms-error.log
```

### System Logs

```bash
# System logs
sudo journalctl -u nginx -f
sudo journalctl -u mysql -f
```

### Health Check Monitoring

Set up a monitoring service to check:

```bash
# Health endpoint
curl https://yourdomain.com/api/health

# Should return JSON with status: "OK"
```

---

## Troubleshooting

### Application Won't Start

1. **Check PM2 logs:**
   ```bash
   pm2 logs vms-server --lines 50
   ```

2. **Check if port is in use:**
   ```bash
   sudo netstat -tulpn | grep 5000
   # Or
   sudo lsof -i :5000
   ```

3. **Check environment variables:**
   ```bash
   cd /var/www/vms/server
   cat .env
   ```

4. **Test database connection:**
   ```bash
   mysql -u vms_user -p vms
   ```

5. **Check file permissions:**
   ```bash
   ls -la /var/www/vms
   ```

### Database Connection Errors

1. **Verify MySQL is running:**
   ```bash
   sudo systemctl status mysql
   ```

2. **Check MySQL credentials:**
   ```bash
   mysql -u vms_user -p vms
   ```

3. **Check MySQL bind address:**
   ```bash
   sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
   # Ensure: bind-address = 127.0.0.1
   ```

4. **Test connection from Node.js:**
   ```bash
   cd /var/www/vms/server
   node -e "require('dotenv').config(); const mysql = require('mysql2/promise'); mysql.createConnection({host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME}).then(() => console.log('OK')).catch(e => console.error(e));"
   ```

### Nginx Errors

1. **Test Nginx configuration:**
   ```bash
   sudo nginx -t
   ```

2. **Check Nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Check if Nginx is running:**
   ```bash
   sudo systemctl status nginx
   ```

4. **Verify upstream connection:**
   ```bash
   curl http://127.0.0.1:5000/api/health
   ```

### Socket.io Connection Issues

1. **Check CORS configuration in server/.env:**
   ```env
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

2. **Verify WebSocket proxy in Nginx:**
   - Check `/socket.io/` location block in nginx.conf

3. **Check browser console for errors**

4. **Test Socket.io connection:**
   ```bash
   curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: test" http://localhost:5000/socket.io/
   ```

### Build Errors

1. **Clear node_modules and reinstall:**
   ```bash
   cd /var/www/vms/client
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Check Node.js version:**
   ```bash
   node -v  # Should be 16+
   ```

3. **Check available memory:**
   ```bash
   free -h
   ```

---

## Common Errors & Solutions

### Error: "Cannot find module"

**Solution:**
```bash
cd /var/www/vms/server
rm -rf node_modules
npm install --production
```

### Error: "EADDRINUSE: address already in use"

**Solution:**
```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill the process
sudo kill -9 <PID>

# Or change port in server/.env
```

### Error: "Access denied for user"

**Solution:**
- Verify database credentials in `server/.env`
- Check MySQL user permissions:
  ```sql
  SHOW GRANTS FOR 'vms_user'@'localhost';
  ```

### Error: "CORS policy: No 'Access-Control-Allow-Origin'"

**Solution:**
- Update `ALLOWED_ORIGINS` in `server/.env`:
  ```env
  ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
  ```
- Restart application:
  ```bash
  pm2 restart vms-server
  ```

### Error: "502 Bad Gateway"

**Solution:**
1. Check if Node.js app is running:
   ```bash
   pm2 status
   ```

2. Check if app is listening on correct port:
   ```bash
   curl http://localhost:5000/api/health
   ```

3. Check Nginx error logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

### Error: "504 Gateway Timeout"

**Solution:**
- Increase timeout in nginx.conf:
  ```nginx
  proxy_read_timeout 300s;
  proxy_connect_timeout 300s;
  proxy_send_timeout 300s;
  ```

### Error: "Module not found: Can't resolve"

**Solution:**
```bash
cd /var/www/vms/client
rm -rf node_modules build
npm install
npm run build
```

### Error: "JWT_SECRET is not defined"

**Solution:**
- Add JWT_SECRET to `server/.env`:
  ```bash
  echo "JWT_SECRET=$(openssl rand -base64 32)" >> server/.env
  ```
- Restart application:
  ```bash
  pm2 restart vms-server
  ```

---

## Backup & Recovery

### Database Backup

#### Automated Backup Script

Create `/var/www/vms/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/vms"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="vms"
DB_USER="vms_user"

mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/vms_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/vms_$DATE.sql

# Delete backups older than 30 days
find $BACKUP_DIR -name "vms_*.sql.gz" -mtime +30 -delete

echo "Backup completed: vms_$DATE.sql.gz"
```

Make it executable:
```bash
chmod +x /var/www/vms/backup-db.sh
```

#### Setup Cron Job for Automatic Backups

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /var/www/vms/backup-db.sh
```

### Application Backup

```bash
# Backup entire application
tar -czf /var/backups/vms/app_$(date +%Y%m%d).tar.gz /var/www/vms

# Backup only important files
tar -czf /var/backups/vms/config_$(date +%Y%m%d).tar.gz \
  /var/www/vms/server/.env \
  /var/www/vms/ecosystem.config.js \
  /var/www/vms/nginx.conf
```

### Recovery

#### Restore Database

```bash
# Restore from backup
mysql -u vms_user -p vms < /var/backups/vms/vms_20240101_020000.sql
```

#### Restore Application

```bash
# Extract backup
tar -xzf /var/backups/vms/app_20240101.tar.gz -C /
```

---

## Security Checklist

### ✅ Pre-Deployment Security

- [ ] Changed all default passwords
- [ ] Generated strong JWT_SECRET (32+ characters)
- [ ] Generated strong SESSION_SECRET
- [ ] Set DEMO_MODE=false for production
- [ ] Configured strong MySQL password
- [ ] Limited MySQL user privileges
- [ ] Disabled root MySQL remote login
- [ ] Configured firewall (UFW/firewalld)
- [ ] Set up SSL/HTTPS
- [ ] Configured CORS properly
- [ ] Set proper file permissions
- [ ] Removed unnecessary packages
- [ ] Updated system packages

### ✅ Post-Deployment Security

- [ ] Tested all API endpoints
- [ ] Verified HTTPS is working
- [ ] Checked SSL certificate expiration
- [ ] Set up automatic SSL renewal
- [ ] Configured log rotation
- [ ] Set up monitoring/alerts
- [ ] Tested backup and recovery
- [ ] Documented all credentials securely
- [ ] Set up fail2ban (optional but recommended)
- [ ] Regular security updates scheduled

### ✅ Ongoing Security

- [ ] Regular backups verified
- [ ] Security updates applied
- [ ] Logs monitored
- [ ] SSL certificates renewed automatically
- [ ] Database backups tested
- [ ] Access logs reviewed
- [ ] Error logs monitored

---

## Additional Resources

### Useful Commands Reference

```bash
# Application Management
pm2 restart vms-server          # Restart app
pm2 logs vms-server              # View logs
pm2 monit                        # Monitor resources

# Database Management
mysql -u vms_user -p vms        # Access database
mysqldump -u vms_user -p vms > backup.sql  # Backup

# Nginx Management
sudo nginx -t                    # Test config
sudo systemctl reload nginx      # Reload config
sudo systemctl restart nginx      # Restart Nginx

# System Monitoring
htop                             # Process monitor
df -h                            # Disk usage
free -h                          # Memory usage
netstat -tulpn                    # Network connections
```

### Support & Maintenance

- **Logs Location:**
  - Application: `/var/www/vms/logs/`
  - Nginx: `/var/log/nginx/`
  - System: `/var/log/syslog` or `journalctl`

- **Configuration Files:**
  - Application: `/var/www/vms/server/.env`
  - PM2: `/var/www/vms/ecosystem.config.js`
  - Nginx: `/etc/nginx/sites-available/vms`
  - MySQL: `/etc/mysql/mysql.conf.d/mysqld.cnf`

---

## Quick Deployment Checklist

Use this checklist for a quick deployment:

- [ ] Server updated and secured
- [ ] Node.js 16+ installed
- [ ] MySQL installed and configured
- [ ] Database and user created
- [ ] Project files uploaded
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Client built successfully
- [ ] Database connection tested
- [ ] Application started with PM2
- [ ] PM2 auto-start configured
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained
- [ ] Firewall configured
- [ ] Health check passing
- [ ] All endpoints tested
- [ ] Backups configured
- [ ] Monitoring set up

---

## Need Help?

If you encounter any issues not covered in this guide:

1. Check the **Troubleshooting** section
2. Review the **Common Errors & Solutions** section
3. Check application logs: `pm2 logs vms-server`
4. Check Nginx logs: `sudo tail -f /var/log/nginx/vms-error.log`
5. Verify all configuration files are correct
6. Ensure all prerequisites are met

---

**Last Updated:** 2024
**Version:** 1.0

