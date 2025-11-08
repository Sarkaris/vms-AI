const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register new admin
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role, department } = req.body;
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingAdmin) {
      return res.status(400).json({ 
        message: 'Admin with this email or username already exists' 
      });
    }
    
    const admin = new Admin({
      username,
      email,
      password,
      firstName,
      lastName,
      role,
      department
    });
    
    await admin.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { adminId: admin._id, role: admin.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        department: admin.department,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login admin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : email;
    
    // Find admin by email
    const admin = await Admin.findOne({ email: normalizedEmail });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if account is locked
    if (admin.isLocked) {
      return res.status(423).json({ 
        message: 'Account is locked due to too many failed login attempts' 
      });
    }
    
    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      await admin.incLoginAttempts();
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Reset login attempts and update last login
    await admin.resetLoginAttempts();
    admin.lastLogin = new Date();
    await admin.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { adminId: admin._id, role: admin.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        department: admin.department,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.adminId = decoded.adminId;
    req.role = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Role-based access control middleware
const requireRole = (allowedRoles = []) => (req, res, next) => {
  try {
    if (!req.role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// Get current admin profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    const { password, ...safe } = admin;
    res.json(safe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update admin profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { firstName, lastName, email, department } = req.body;
    
    const updated = await Admin.findByIdAndUpdate(
      req.adminId,
      { firstName, lastName, email, department },
      { new: true }
    );
    const { password: _pw, ...safe } = updated || {};
    res.json(safe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Change password
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Verify current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password with encryption
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Logout (client-side token removal)
router.post('/logout', verifyToken, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = { router, verifyToken, requireRole };
