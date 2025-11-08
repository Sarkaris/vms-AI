const mongoose = require('mongoose');
const Admin = require('../models/Admin');


// Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vms', {
mongoose.connect(process.env.MONGODB_URI , {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  // console.log('MongoDB connected'+process.env.MONGODB_URI);

  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
    if (existingAdmin) {
      // console.log('Admin already exists.');
      process.exit(0); // exit the script
    }

    // Create new admin
    const admin = new Admin({
      username: 'admin',
      email: 'admin@gmail.com',
      password: 'admin123',
      firstName: 'Default',
      lastName: 'Admin',
      role: 'Super Admin',
      department: 'Management',
      permissions: {
        canViewAnalytics: true,
        canManageVisitors: true,
        canManageAdmins: true,
        canExportData: true,
        canViewReports: true
      }
    });

    await admin.save();
    // console.log('Admin created successfully!');
    process.exit(0); // exit the script

  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
