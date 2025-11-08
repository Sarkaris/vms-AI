const express = require('express');
const router = express.Router();
const Emergency = require('../models/Emergency');
const { verifyToken, requireRole } = require('./auth');

// Create emergency (Visitor or Departmental)
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    // Generate simple incident code EMG-YYYYMMDD-hhmmss-RAND
    const ts = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const code = `EMG-${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;

    const emergency = await Emergency.create({ ...body, incidentCode: code });

    // Emit socket event
    req.app.get('io').emit('emergency-created', {
      _id: emergency.id,
      type: emergency.type,
      incidentCode: emergency.incidentCode,
      location: emergency.location,
      status: emergency.status,
      createdAt: emergency.createdAt,
    });

    res.status(201).json(emergency);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// List emergencies with optional filters
router.get('/', async (req, res) => {
  try {
    const { type, status, from, to, location, q, limit = 50, page = 1 } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (location) query.location = location;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }
    if (q) {
      const like = String(q).trim();
      query.$or = [
        { incidentCode: like },
        { departmentName: like },
        { pocName: like },
        { visitorFirstName: like },
        { visitorLastName: like },
      ];
    }

    const { rows, total } = await Emergency.find(query, { limit: Number(limit), page: Number(page) });
    res.json({ emergencies: rows, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Resolve emergency
router.put('/:id/resolve', async (req, res) => {
  try {
    console.log('Resolving emergency with ID:', req.params.id);
    const emergency = await Emergency.findByIdAndUpdate(
      req.params.id,
      { status: 'Resolved', resolvedAt: new Date() }
    );
    console.log('Resolve result:', emergency);
    if (emergency) {
      req.app.get('io')?.emit('emergency-updated', { _id: emergency.id || req.params.id, status: 'Resolved' });
      return res.json({ success: true, emergency });
    }
    return res.status(404).json({ message: 'Emergency not found' });
  } catch (error) {
    console.error('Error resolving emergency:', error);
    return res.status(500).json({ message: error.message || 'Failed to resolve emergency' });
  }
});

// Cancel emergency
router.put('/:id/cancel', async (req, res) => {
  try {
    console.log('Cancelling emergency with ID:', req.params.id);
    const emergency = await Emergency.findByIdAndUpdate(
      req.params.id,
      { status: 'Cancelled', resolvedAt: new Date() }
    );
    console.log('Cancel result:', emergency);
    if (emergency) {
      req.app.get('io')?.emit('emergency-updated', { _id: emergency.id || req.params.id, status: 'Cancelled' });
      return res.json({ success: true, emergency });
    }
    return res.status(404).json({ message: 'Emergency not found' });
  } catch (error) {
    console.error('Error cancelling emergency:', error);
    return res.status(500).json({ message: error.message || 'Failed to cancel emergency' });
  }
});

module.exports = router;


