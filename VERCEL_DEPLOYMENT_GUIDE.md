# Vercel Deployment Guide for VMS Application

## 🚀 Quick Deploy to Vercel

### Prerequisites
- Vercel account (free)
- GitHub/GitLab/Bitbucket account (for repository)
- Node.js 16+ installed locally

### Step 1: Prepare Your Application

1. **Build the React frontend** (if not already built):
```bash
cd client
npm install
npm run build
cd ..
```

2. **Test locally**:
```bash
cd server
npm install
npm start
```

### Step 2: Deploy to Vercel

#### Option A: One-Click Deploy (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables (see below)
5. Click "Deploy"

#### Option B: CLI Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel --prod
```

### Step 3: Environment Variables

Set these environment variables in Vercel dashboard:

```env
DEMO_MODE=true
DEMO_DATABASE=sqlite
JWT_SECRET=your-secure-jwt-secret-key-change-this-in-production
NODE_ENV=production
PORT=5000
```

### Step 4: Demo Login Credentials

Your application now supports multiple demo accounts:

1. **Primary Demo Account**:
   - Email: `demo@vms.com`
   - Password: `password`

2. **Custom Account (as requested)**:
   - Username: `123`
   - Email: `admin123@vms.com`
   - Password: `123`

### Step 5: Verify Deployment

Test these endpoints after deployment:
- Health Check: `https://your-app.vercel.app/api/health`
- Demo Status: `https://your-app.vercel.app/api/demo-status`
- Login: `https://your-app.vercel.app/api/auth/login`

### 📋 Features Available in Demo Mode

- ✅ Visitor Management (View Only)
- ✅ Emergency Management (View Only)
- ✅ Analytics Dashboard
- ✅ Real-time Updates (Socket.io)
- ✅ Admin Authentication
- ✅ Multi-user Support

### 🔒 Security Notes

- Demo mode is **read-only** (no modifications allowed)
- JWT tokens expire after 24 hours
- All data is stored in-memory (resets on restart)
- CORS enabled for cross-origin requests

### 🛠️ Troubleshooting

#### Build Issues
If you encounter build issues:
1. Ensure client build exists: `cd client && npm run build`
2. Check Node.js version compatibility
3. Verify all dependencies are installed

#### Environment Variables
- Double-check all environment variables are set
- Ensure no spaces in values
- Use strong JWT secret in production

#### Database Issues
- Demo uses in-memory SQLite (no external DB needed)
- Data resets on each deployment/restart
- Check server logs in Vercel dashboard

### 📱 Access Your Deployed App

After successful deployment:
1. Frontend: `https://your-app.vercel.app`
2. API Base: `https://your-app.vercel.app/api`
3. API Documentation: Test endpoints using the health check

### 🔄 Updating Your Deployment

1. Push changes to your Git repository
2. Vercel automatically deploys updates
3. Monitor deployment status in Vercel dashboard

### 📞 Support

For issues:
1. Check Vercel deployment logs
2. Test locally first
3. Verify environment variables
4. Check browser console for client-side errors

---

**Happy Deploying! 🎉**