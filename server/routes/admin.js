const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const { verifyToken, requireRole } = require('./auth');
// dotenv import 

require('dotenv').config()

// Helper: default permissions by role
function getDefaultPermissions(role) {
  switch (role) {
    case 'Super Admin':
      return {
        canViewAnalytics: true,
        canManageVisitors: true,
        canManageAdmins: true,
        canExportData: true,
        canViewReports: true
      };
    case 'Admin':
      return {
        canViewAnalytics: true,
        canManageVisitors: true,
        canManageAdmins: false,
        canExportData: true,
        canViewReports: true
      };
    case 'Security':
    case 'Receptionist':
      return {
        canViewAnalytics: false,
        canManageVisitors: true,
        canManageAdmins: false,
        canExportData: false,
        canViewReports: true
      };
    default:
      return {
        canViewAnalytics: false,
        canManageVisitors: false,
        canManageAdmins: false,
        canExportData: false,
        canViewReports: false
      };
  }
}

// Get all admins
router.get('/', verifyToken, async (req, res) => {
  try {
    const admins = await Admin.find({ isActive: true });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new admin
// Only Super Admin can create Admins and Users
router.post('/', verifyToken, requireRole(['Super Admin']), async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.role) payload.role = 'Admin';
    // Normalize
    if (payload.email) payload.email = payload.email.toLowerCase().trim();
    if (!payload.permissions) payload.permissions = getDefaultPermissions(payload.role);

    const created = await new Admin(payload).save();
    res.status(201).json({
      id: created._id,
      username: created.username,
      email: created.email,
      firstName: created.firstName,
      lastName: created.lastName,
      role: created.role,
      department: created.department,
      permissions: created.permissions
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ message: 'Email or username already exists' });
    }
    return res.status(400).json({ message: error.message });
  }
});

// Admins and Super Admin can create user-level accounts (Security/Receptionist)
router.post('/users', verifyToken, requireRole(['Super Admin', 'Admin']), async (req, res) => {
  try {
    const payload = { ...req.body };
    // Force allowed roles
    const requestedRole = payload.role || 'Security';
    const allowedRoles = ['Security', 'Receptionist'];
    if (!allowedRoles.includes(requestedRole)) {
      return res.status(403).json({ message: 'Only Security or Receptionist roles are allowed here' });
    }
    payload.role = requestedRole;
    if (payload.email) payload.email = payload.email.toLowerCase().trim();
    if (!payload.permissions) payload.permissions = getDefaultPermissions(payload.role);

    const user = await new Admin(payload).save();

    res.status(201).json({
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department,
      permissions: user.permissions
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ message: 'Email or username already exists' });
    }
    return res.status(400).json({ message: error.message });
  }
});

// Update admin
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const currentAdmin = await Admin.findById(req.adminId);
    if (!currentAdmin.permissions.canManageAdmins) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    const update = { ...req.body };
    if (update.email) update.email = update.email.toLowerCase().trim();
    if (update.role && !update.permissions) {
      update.permissions = getDefaultPermissions(update.role);
    }

    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    res.json(admin);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Deactivate admin
router.put('/:id/deactivate', verifyToken, async (req, res) => {
  try {
    const currentAdmin = await Admin.findById(req.adminId);
    if (!currentAdmin.permissions.canManageAdmins) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Utility endpoints
router.get('/roles/list', verifyToken, async (req, res) => {
  res.json(['Super Admin', 'Admin', 'Security', 'Receptionist']);
});

router.get('/by-role/:role', verifyToken, async (req, res) => {
  try {
    const role = req.params.role;
    const admins = await Admin.find({ role, isActive: true });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get admin statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const stats = await Admin.aggregateByRole();
    const totalAdmins = await Admin.countDocuments({ isActive: true });
    const activeToday = await Admin.countDocuments({ lastLoginSinceStartOfDay: new Date(new Date().setHours(0, 0, 0, 0)) });
    
    res.json({
      byRole: stats,
      totalAdmins,
      activeToday
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
