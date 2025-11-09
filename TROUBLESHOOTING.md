# VMS Troubleshooting Guide

Complete troubleshooting guide for common deployment issues and errors.

## Quick Diagnostic Commands

```bash
# Check application status
pm2 status
pm2 logs vms-server --lines 50

# Check database connection
mysql -u vms_user -p vms

# Check if ports are in use
sudo netstat -tulpn | grep 5000
sudo lsof -i :5000

# Check Nginx status
sudo systemctl status nginx
sudo nginx -t

# Check system resources
free -h
df -h
top
```

---

## Error Categories

### 1. Application Startup Errors

#### Error: "Cannot find module 'X'"

**Symptoms:**
```
Error: Cannot find module 'express'
    at Function.Module._resolveFilename
```

**Causes:**
- Missing node_modules
- Incomplete npm install
- Wrong Node.js version

**Solutions:**
```bash
cd /var/www/vms/server
rm -rf node_modules package-lock.json
npm install --production

# Verify Node.js version
node -v  # Should be 16+
```

---

#### Error: "EADDRINUSE: address already in use :::5000"

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Causes:**
- Another process using port 5000
- Previous instance not stopped

**Solutions:**
```bash
# Find process using port 5000
sudo lsof -i :5000
# Or
sudo netstat -tulpn | grep 5000

# Kill the process
sudo kill -9 <PID>

# Or change port in server/.env
PORT=5001
```

---

#### Error: "JWT_SECRET is not defined"

**Symptoms:**
```
Error: JWT_SECRET is not defined
```

**Causes:**
- Missing JWT_SECRET in .env file

**Solutions:**
```bash
cd /var/www/vms/server

# Generate and add JWT_SECRET
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env

# Restart application
pm2 restart vms-server
```

---

### 2. Database Connection Errors

#### Error: "Access denied for user 'vms_user'@'localhost'"

**Symptoms:**
```
Error: Access denied for user 'vms_user'@'localhost' (using password: YES)
```

**Causes:**
- Wrong password in .env
- User doesn't exist
- User doesn't have privileges

**Solutions:**
```bash
# 1. Verify user exists
sudo mysql -u root -p
mysql> SELECT User, Host FROM mysql.user WHERE User='vms_user';

# 2. Reset password
mysql> ALTER USER 'vms_user'@'localhost' IDENTIFIED BY 'new_password';
mysql> FLUSH PRIVILEGES;

# 3. Update .env file
cd /var/www/vms/server
nano .env  # Update DB_PASSWORD

# 4. Restart application
pm2 restart vms-server
```

---

#### Error: "Unknown database 'vms'"

**Symptoms:**
```
Error: Unknown database 'vms'
```

**Causes:**
- Database doesn't exist
- Wrong database name in .env

**Solutions:**
```bash
# Create database
sudo mysql -u root -p
mysql> CREATE DATABASE vms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
mysql> GRANT ALL PRIVILEGES ON vms.* TO 'vms_user'@'localhost';
mysql> FLUSH PRIVILEGES;
mysql> EXIT;

# Verify database exists
mysql -u vms_user -p vms
```

---

#### Error: "ECONNREFUSED"

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Causes:**
- MySQL not running
- Wrong host/port
- Firewall blocking

**Solutions:**
```bash
# Check if MySQL is running
sudo systemctl status mysql

# Start MySQL if not running
sudo systemctl start mysql
sudo systemctl enable mysql

# Verify connection
mysql -u vms_user -p vms
```

---

### 3. Nginx Errors

#### Error: "502 Bad Gateway"

**Symptoms:**
- Browser shows "502 Bad Gateway"
- Nginx can't connect to backend

**Causes:**
- Node.js app not running
- Wrong upstream configuration
- Port mismatch

**Solutions:**
```bash
# 1. Check if app is running
pm2 status

# 2. Check if app responds
curl http://localhost:5000/api/health

# 3. Check Nginx upstream config
sudo nano /etc/nginx/sites-available/vms
# Verify: upstream vms_backend { server 127.0.0.1:5000; }

# 4. Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

#### Error: "504 Gateway Timeout"

**Symptoms:**
- Request takes too long
- Timeout error

**Causes:**
- Slow database queries
- Insufficient resources
- Timeout too short

**Solutions:**
```bash
# Increase timeout in nginx.conf
sudo nano /etc/nginx/sites-available/vms

# Add/update:
proxy_read_timeout 300s;
proxy_connect_timeout 300s;
proxy_send_timeout 300s;

# Reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

#### Error: "nginx: [emerg] bind() to 0.0.0.0:80 failed"

**Symptoms:**
```
nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)
```

**Causes:**
- Another service using port 80
- Apache running

**Solutions:**
```bash
# Find process using port 80
sudo lsof -i :80

# Stop Apache if running
sudo systemctl stop apache2
sudo systemctl disable apache2

# Or change Nginx port (not recommended)
```

---

### 4. Build Errors

#### Error: "Module not found: Can't resolve 'X'"

**Symptoms:**
```
Module not found: Can't resolve 'axios'
```

**Causes:**
- Missing dependencies
- Corrupted node_modules

**Solutions:**
```bash
cd /var/www/vms/client

# Clean install
rm -rf node_modules package-lock.json build
npm install
npm run build

# Verify build
ls -la build/
```

---

#### Error: "JavaScript heap out of memory"

**Symptoms:**
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Causes:**
- Insufficient memory
- Large build process

**Solutions:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Or in package.json scripts:
"build": "NODE_OPTIONS='--max-old-space-size=4096' react-scripts build"

# Then rebuild
npm run build
```

---

### 5. Socket.io Errors

#### Error: "WebSocket connection failed"

**Symptoms:**
- Socket.io not connecting
- Real-time updates not working

**Causes:**
- CORS issues
- Nginx WebSocket proxy misconfigured
- Firewall blocking

**Solutions:**
```bash
# 1. Check CORS in server/.env
ALLOWED_ORIGINS=https://yourdomain.com

# 2. Verify Nginx WebSocket config
sudo nano /etc/nginx/sites-available/vms
# Should have location /socket.io/ block with upgrade headers

# 3. Test WebSocket connection
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  http://localhost:5000/socket.io/

# 4. Restart services
pm2 restart vms-server
sudo systemctl reload nginx
```

---

#### Error: "CORS policy: No 'Access-Control-Allow-Origin'"

**Symptoms:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Causes:**
- Wrong ALLOWED_ORIGINS
- CORS middleware not working

**Solutions:**
```bash
# Update server/.env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Restart application
pm2 restart vms-server

# Verify in browser console - should see CORS headers
```

---

### 6. SSL/HTTPS Errors

#### Error: "SSL certificate problem"

**Symptoms:**
- Browser shows "Not Secure"
- Certificate errors

**Causes:**
- Certificate expired
- Wrong certificate path
- Certificate not renewed

**Solutions:**
```bash
# Check certificate expiration
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test auto-renewal
sudo certbot renew --dry-run

# Verify certificate paths in nginx.conf
sudo nano /etc/nginx/sites-available/vms
# Should point to: /etc/letsencrypt/live/yourdomain.com/
```

---

### 7. Permission Errors

#### Error: "EACCES: permission denied"

**Symptoms:**
```
Error: EACCES: permission denied, open '/var/www/vms/logs/app.log'
```

**Causes:**
- Wrong file permissions
- Wrong ownership

**Solutions:**
```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/vms

# Fix permissions
sudo chmod -R 755 /var/www/vms
sudo chmod -R 775 /var/www/vms/logs

# For Nginx static files
sudo chown -R www-data:www-data /var/www/vms/client/build
sudo chmod -R 755 /var/www/vms/client/build
```

---

### 8. PM2 Errors

#### Error: "PM2 process keeps restarting"

**Symptoms:**
- Process restarts immediately after start
- High restart count

**Causes:**
- Application crash
- Configuration error
- Missing dependencies

**Solutions:**
```bash
# Check logs for errors
pm2 logs vms-server --lines 100

# Check restart count
pm2 status

# Stop and check manually
pm2 stop vms-server
cd /var/www/vms/server
node index.js  # Run directly to see errors

# Check ecosystem.config.js
cat ecosystem.config.js
```

---

#### Error: "PM2 startup script failed"

**Symptoms:**
- App doesn't start on boot
- PM2 startup command fails

**Solutions:**
```bash
# Regenerate startup script
pm2 unstartup
pm2 startup

# Follow the command shown (usually requires sudo)
# Example:
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username

# Save process list
pm2 save
```

---

## Diagnostic Script

Create a diagnostic script to check common issues:

```bash
#!/bin/bash
# Save as: /var/www/vms/diagnose.sh

echo "=== VMS Diagnostic Report ==="
echo ""

echo "1. Node.js Version:"
node -v
echo ""

echo "2. PM2 Status:"
pm2 status
echo ""

echo "3. Application Health:"
curl -s http://localhost:5000/api/health | jq . || echo "Health check failed"
echo ""

echo "4. Database Connection:"
cd /var/www/vms/server
node -e "
require('dotenv').config();
const mysql = require('mysql2/promise');
(async () => {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        await conn.end();
        console.log('✓ Database connection: OK');
    } catch (e) {
        console.log('✗ Database connection: FAILED -', e.message);
    }
})();
"
echo ""

echo "5. Port Status:"
sudo netstat -tulpn | grep -E ':(80|443|5000)' || echo "No processes found on ports 80, 443, 5000"
echo ""

echo "6. Nginx Status:"
sudo systemctl status nginx --no-pager | head -5
echo ""

echo "7. Disk Space:"
df -h | grep -E '^/dev'
echo ""

echo "8. Memory Usage:"
free -h
echo ""

echo "9. Build Directory:"
ls -la /var/www/vms/client/build/ 2>/dev/null | head -5 || echo "Build directory not found"
echo ""

echo "=== End of Diagnostic ==="
```

Make it executable:
```bash
chmod +x /var/www/vms/diagnose.sh
./diagnose.sh
```

---

## Step-by-Step Recovery

If everything is broken, follow these steps:

### Step 1: Stop Everything
```bash
pm2 stop all
sudo systemctl stop nginx
```

### Step 2: Check Logs
```bash
pm2 logs vms-server --lines 100
sudo tail -100 /var/log/nginx/error.log
```

### Step 3: Verify Configuration
```bash
# Check .env file
cat /var/www/vms/server/.env

# Test database
mysql -u vms_user -p vms

# Test Nginx config
sudo nginx -t
```

### Step 4: Rebuild
```bash
cd /var/www/vms/client
rm -rf node_modules build
npm install
npm run build
```

### Step 5: Restart Services
```bash
pm2 restart vms-server
sudo systemctl start nginx
```

### Step 6: Verify
```bash
curl http://localhost:5000/api/health
curl https://yourdomain.com/api/health
```

---

## Getting Help

If you're still stuck:

1. **Collect Information:**
   ```bash
   # Run diagnostic script
   ./diagnose.sh > diagnostic-report.txt
   
   # Collect logs
   pm2 logs vms-server --lines 200 > pm2-logs.txt
   sudo tail -200 /var/log/nginx/error.log > nginx-errors.txt
   ```

2. **Check Configuration:**
   - Verify all .env variables
   - Check Nginx configuration
   - Verify database credentials

3. **Review Documentation:**
   - Check DEPLOYMENT.md
   - Review error messages carefully

4. **Common Issues:**
   - Typos in configuration files
   - Missing environment variables
   - Wrong file permissions
   - Port conflicts

---

**Remember:** Most errors are configuration-related. Double-check all settings!

