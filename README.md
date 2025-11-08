# VMS Pro - Advanced Visitor Management System

A comprehensive, modern Visitor Management System built with React, Node.js, and MongoDB. Designed to win hackathons with its impressive features and professional UI.

## 🚀 Features

### Core Functionality
- **Digital Check-in/Check-out** - Replace paper logbooks with a streamlined digital process
- **Real-time Dashboard** - Live visitor tracking and analytics
- **QR Code Badges** - Generate unique QR codes for each visitor
- **Photo Capture** - Webcam integration for visitor photos
- **ID Verification** - Document type and number tracking
- **Health Screening** - Temperature checks and health declarations

### Advanced Features
- **Real-time Analytics** - Traffic patterns, peak hours, and visitor insights
- **Security Levels** - Low, Medium, High security classifications
- **VIP Access** - Special handling for VIP visitors
- **Overdue Alerts** - Automatic notifications for overdue visitors
- **Multi-admin Support** - Role-based access control
- **Department Management** - Track visitors by department
- **Export Capabilities** - Data export for reporting

### Security & Compliance
- **Secure Authentication** - JWT-based authentication with role permissions
- **Data Encryption** - Secure storage of visitor information
- **Audit Trail** - Complete visitor history tracking
- **Privacy Controls** - GDPR-compliant data handling

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Beautiful data visualizations
- **Socket.io Client** - Real-time updates
- **React Router** - Client-side routing
- **React Hot Toast** - Elegant notifications
- **Framer Motion** - Smooth animations
- **Lucide React** - Beautiful icons

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - Real-time communication
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Multer** - File upload handling
- **QRCode** - QR code generation
- **Nodemailer** - Email notifications

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd visitor-management-system
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cd server
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/vms
   JWT_SECRET=your-super-secret-jwt-key-here
   PORT=5000
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend development server (port 3000).

### Manual Setup

If you prefer to set up each part separately:

**Backend Setup:**
```bash
cd server
npm install
npm run dev
```

**Frontend Setup:**
```bash
cd client
npm install
npm start
```

## 🎯 Demo Credentials

For testing purposes, use these demo credentials:
- **Email:** admin@vms.com
- **Password:** admin123

## 📱 Usage

### For Receptionists
1. **Check-in Visitors**
   - Navigate to "Check In" page
   - Complete the 4-step process:
     - Visitor Information
     - Visit Details
     - Security Check
     - Photo Capture
   - Generate QR code badge

2. **Manage Current Visitors**
   - View all checked-in visitors
   - Check out visitors when they leave
   - Handle overdue visitors

### For Administrators
1. **Dashboard Overview**
   - Real-time visitor statistics
   - Traffic patterns and analytics
   - Security insights

2. **Analytics & Reports**
   - Hourly/daily visitor distribution
   - Purpose and department analysis
   - Peak hours identification
   - Export capabilities

3. **Admin Management**
   - Create and manage admin accounts
   - Set role-based permissions
   - Monitor admin activity

### For Security Personnel
1. **Security Monitoring**
   - High-security visitor alerts
   - Unusual activity detection
   - Long-duration visit tracking
   - VIP visitor notifications

## 🔧 Configuration

### Environment Variables

**Server (.env):**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/vms

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Server Port
PORT=5000

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Customization

**Branding:**
- Update logo in `client/public/`
- Modify colors in `client/tailwind.config.js`
- Change company name in components

**Features:**
- Enable/disable features in settings
- Customize visitor form fields
- Modify security requirements

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/register` - Admin registration
- `GET /api/auth/profile` - Get admin profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Visitors
- `GET /api/visitors` - Get all visitors
- `POST /api/visitors` - Create new visitor
- `GET /api/visitors/:id` - Get visitor by ID
- `PUT /api/visitors/:id` - Update visitor
- `PUT /api/visitors/:id/checkout` - Check out visitor
- `DELETE /api/visitors/:id` - Delete visitor

### Analytics
- `GET /api/analytics/traffic` - Traffic analytics
- `GET /api/analytics/dashboard` - Dashboard data
- `GET /api/analytics/trends` - Visitor trends
- `GET /api/analytics/security` - Security insights

### Admin Management
- `GET /api/admin` - Get all admins
- `POST /api/admin` - Create admin
- `PUT /api/admin/:id` - Update admin
- `PUT /api/admin/:id/deactivate` - Deactivate admin

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd client
npm run build

# Start production server
cd ../server
npm start
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Cloud Deployment
- **Frontend:** Deploy to Vercel, Netlify, or AWS S3
- **Backend:** Deploy to Heroku, AWS EC2, or DigitalOcean
- **Database:** Use MongoDB Atlas for cloud database

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Hackathon Features

This VMS is designed to impress judges with:

- **Professional UI/UX** - Modern, responsive design
- **Real-time Features** - Live updates and notifications
- **Advanced Analytics** - Comprehensive data visualization
- **Security Focus** - Multi-level security features
- **Scalability** - Built to handle enterprise-level traffic
- **Innovation** - QR codes, photo capture, health screening
- **Complete Solution** - Full-stack application with database

## 📞 Support

For support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ for Hackathon Success**
