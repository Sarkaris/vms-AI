# VMS Demo Mode Setup & Deployment Guide

## 🚀 Quick Start (Demo Mode)

### Option 1: One-Command Start (Recommended)
```bash
cd server
# Windows
start-demo.bat

# Unix/Mac/Linux
./start-demo.sh
```

### Option 2: Manual Setup
```bash
cd server
npm run demo        # Windows
npm run demo:unix   # Unix/Mac/Linux
```

## 📋 Demo Mode Features

✅ **Read-Only Access**: All data viewing features work  
✅ **Full UI Experience**: Navigate through all pages  
✅ **Real-time Updates**: See live visitor counts and analytics  
✅ **QR Code Simulation**: Test QR functionality  
✅ **Emergency System**: View emergency management features  
❌ **No Data Modification**: Cannot add, edit, or delete records  

## 🔧 Local Development

### Frontend (Client)
```bash
cd client
npm install
npm start          # Runs on http://localhost:3000
```

### Backend (Server)
```bash
cd server
npm install
npm run dev        # Runs on http://localhost:5000
```

## 🌐 Deployment Options

### 1. Vercel Deployment (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel

# Or use the configuration file
vercel --prod
```

**Environment Variables for Vercel:**
```
DEMO_MODE=true
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret
```

### 2. Railway Deployment
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy from server directory
cd server
railway login
railway init
railway up
```

### 3. Render Deployment
- Connect your GitHub repository
- Use the following build command:
```bash
cd server && npm install && npm run build:client
```
- Start command: `node index.js`

## 📊 Demo Data Setup

### Import Sample Data
```bash
cd server
npm run import-complete    # Import complete demo dataset
npm run add-visitors      # Add more visitor records
```

### Database Schema
The demo uses the same schema as production but with read-only restrictions:
- **Admins**: User management system
- **Visitors**: Visitor records with check-in/out
- **Emergencies**: Emergency incident management

## 🔍 API Endpoints

### Demo Status
```
GET /api/demo-status      # Check if demo mode is active
GET /api/health          # Health check with memory info
```

### Main Features (Read-Only in Demo)
```
GET /api/visitors        # List all visitors
GET /api/analytics       # Analytics dashboard data
GET /api/emergencies     # Emergency incidents
GET /api/admin          # Admin dashboard
```

## 🛡️ Security Features

### Demo Mode Protection
- All POST/PUT/DELETE requests are blocked
- Returns friendly error messages
- Shows demo banner in UI
- Logs demo activity for monitoring

### Rate Limiting
- Configurable request limits
- IP-based throttling
- Memory monitoring and cleanup

## 📱 Frontend Demo Features

### Demo Banner
- Visible on all pages when demo mode is active
- Shows read-only restrictions
- Collapsible information panel
- Responsive design

### Simulated Features
- QR code scanning (simulated)
- Real-time notifications
- Visitor check-in/out flow
- Emergency management
- Analytics dashboard

## 🔧 Configuration

### Environment Variables
```bash
# Demo Mode
DEMO_MODE=true              # Enable demo mode

# Database
DB_HOST=localhost          # Database host
DB_PORT=3306              # Database port
DB_USER=root              # Database user
DB_PASSWORD=              # Database password
DB_NAME=vms_demo          # Database name

# Security
JWT_SECRET=your-secret    # JWT signing secret
BCRYPT_ROUNDS=10          # Password hashing rounds
```

### Customization
- Modify `server/middleware/demoMode.js` for custom demo behavior
- Update `client/src/components/DemoBanner.js` for UI changes
- Adjust rate limiting in `server/index.js`

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MySQL is running
   - Verify credentials in `.env`
   - Run `npm run migrate` to create schema

2. **Demo Mode Not Working**
   - Ensure `DEMO_MODE=true` in environment
   - Check `/api/demo-status` endpoint
   - Restart the server

3. **Frontend Build Fails**
   - Clear `node_modules` and reinstall
   - Check Node.js version compatibility
   - Verify build scripts in `package.json`

### Performance Optimization
- Use connection pooling for database
- Enable gzip compression
- Implement caching for analytics
- Monitor memory usage with `/api/health`

## 📞 Support

For issues or questions:
1. Check the health endpoint: `/api/health`
2. Verify demo status: `/api/demo-status`
3. Review server logs for errors
4. Ensure all dependencies are installed

## 🎯 Next Steps

1. **Customize the demo data** using import scripts
2. **Add your branding** to the demo banner
3. **Configure your database** for production use
4. **Set up monitoring** with the health endpoint
5. **Deploy to your preferred platform**

---

**Happy Demoing! 🎉**