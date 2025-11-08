const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

// --- SPECIFIC ROUTES (should come first) ---

// Get all visitors with advanced filtering
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      date, 
      startDate, 
      endDate,
      departments,
      visitorTypes,
      purposes,
      securityLevels,
      timeSlots,
      page = 1, 
      limit = 100 
    } = req.query;
    
    const query = {};
    
    // Status filter
    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }
    
    // Date range filter
    if (startDate && endDate) {
      const start = moment(startDate).startOf('day').toDate();
      const end = moment(endDate).endOf('day').toDate();
      query.checkInTime = { $gte: start, $lte: end };
    } else if (date) {
      const startDate = moment(date).startOf('day').toDate();
      const endDate = moment(date).endOf('day').toDate();
      query.checkInTime = { $gte: startDate, $lte: endDate };
    }
    
    // Department filter (using purpose field)
    if (departments) {
      const deptArray = Array.isArray(departments) ? departments : departments.split(',');
      query.purpose = { $in: deptArray };
    }
    
    // Visitor type filter (using company field)
    if (visitorTypes) {
      const typeArray = Array.isArray(visitorTypes) ? visitorTypes : visitorTypes.split(',');
      query.company = { $in: typeArray };
    }
    
    // Purpose filter
    if (purposes) {
      const purposeArray = Array.isArray(purposes) ? purposes : purposes.split(',');
      query.purpose = { $in: purposeArray };
    }
    
    // Security level filter
    if (securityLevels) {
      const levelArray = Array.isArray(securityLevels) ? securityLevels : securityLevels.split(',');
      query.securityLevel = { $in: levelArray };
    }
    
    // Time slot filter
    if (timeSlots) {
      const slotArray = Array.isArray(timeSlots) ? timeSlots : timeSlots.split(',');
      const timeQuery = [];
      
      slotArray.forEach(slot => {
        switch (slot) {
          case 'Early Morning (6-9 AM)':
            timeQuery.push({ 
              checkInTime: { 
                $gte: moment().hour(6).minute(0).second(0).toDate(),
                $lt: moment().hour(9).minute(0).second(0).toDate()
              }
            });
            break;
          case 'Morning (9-12 PM)':
            timeQuery.push({ 
              checkInTime: { 
                $gte: moment().hour(9).minute(0).second(0).toDate(),
                $lt: moment().hour(12).minute(0).second(0).toDate()
              }
            });
            break;
          case 'Afternoon (12-3 PM)':
            timeQuery.push({ 
              checkInTime: { 
                $gte: moment().hour(12).minute(0).second(0).toDate(),
                $lt: moment().hour(15).minute(0).second(0).toDate()
              }
            });
            break;
          case 'Late Afternoon (3-6 PM)':
            timeQuery.push({ 
              checkInTime: { 
                $gte: moment().hour(15).minute(0).second(0).toDate(),
                $lt: moment().hour(18).minute(0).second(0).toDate()
              }
            });
            break;
          case 'Evening (6-9 PM)':
            timeQuery.push({ 
              checkInTime: { 
                $gte: moment().hour(18).minute(0).second(0).toDate(),
                $lt: moment().hour(21).minute(0).second(0).toDate()
              }
            });
            break;
          case 'Night (9 PM-6 AM)':
            timeQuery.push({ 
              $or: [
                { 
                  checkInTime: { 
                    $gte: moment().hour(21).minute(0).second(0).toDate(),
                    $lt: moment().hour(23).minute(59).second(59).toDate()
                  }
                },
                { 
                  checkInTime: { 
                    $gte: moment().hour(0).minute(0).second(0).toDate(),
                    $lt: moment().hour(6).minute(0).second(0).toDate()
                  }
                }
              ]
            });
            break;
        }
      });
      
      if (timeQuery.length > 0) {
        query.$or = timeQuery;
      }
    }
    
    const result = await Visitor.list({ ...req.query, page: Number(page), limit: Number(limit) });
    res.json({
      visitors: result.rows,
      totalPages: Math.ceil(result.total / limit),
      currentPage: Number(page),
      total: result.total
    });

  } catch (error) {
    console.error('Error fetching visitors:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new visitor
router.post('/', async (req, res) => {
  try {
    const badgeId = uuidv4();
    
    const visitorData = {
      ...req.body,
      badgeId,
      // Store plain string value for QR, default to badgeId if missing
      qrCode: req.body && req.body.qrCode ? String(req.body.qrCode) : badgeId,
      checkInTime: new Date()
    };
    
    // Clean host fields since they are no longer required
    if (!visitorData.hostName) delete visitorData.hostName;
    if (!visitorData.hostEmail) delete visitorData.hostEmail;
    if (!visitorData.hostDepartment) delete visitorData.hostDepartment;

    const visitor = await Visitor.create(visitorData);
    
    req.app.get('io').emit('visitor-checkin', {
      type: 'checkin',
      visitor: visitor,
      timestamp: new Date()
    });
    
    res.status(201).json(visitor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Find a visitor by a unique identifier (QR string, ID number, phone, email, or alternate IDs)
router.get('/find', async (req, res) => {
  try {
    const raw = req.query.id;
    if (!raw) {
      return res.status(400).json({ message: 'Identifier query parameter is missing.' });
    }

    const identifier = String(raw).trim();
    console.log(identifier)
    // Try to extract a UUID (badgeId) if the scanned string is a URL or contains extra text
    const uuidMatch = identifier.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    const possibleBadgeId = uuidMatch ? uuidMatch[0] : null;

    // If it's a data URL (e.g., stored qrCode image), match by prefix to be resilient to differences
    const isDataUrl = identifier.startsWith('data:image/');

    const visitor = await Visitor.findOneByIdentifier(identifier, possibleBadgeId, isDataUrl);

    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found.' });
    }

    res.status(200).json(visitor);
  } catch (error) {
    console.error('Error finding visitor:', error);
    res.status(500).json({ message: 'Server error while searching for visitor.' });
  }
});

// Get current visitors (checked in)
router.get('/current/active', async (req, res) => {
  try {
    const visitors = await Visitor.getCurrentActive();
    res.json(visitors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get overdue visitors
router.get('/current/overdue', async (req, res) => {
  try {
    const overdueVisitors = await Visitor.getOverdue();
    res.json(overdueVisitors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get visitor statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const today = moment().startOf('day').toDate();
    const tomorrow = moment().endOf('day').toDate();
    
    const stats = await Visitor.getStatsSummary();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// --- PARAMETERIZED ROUTES (should come after specific routes) ---

// Get visitor by a single MongoDB ObjectId
router.get('/:id', async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }
    res.json(visitor);
  } catch (error) {
    // This catches invalid ObjectId formats and prevents the crash
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Visitor not found with that ID' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Get past visit history for a visitor (excluding current record)
router.get('/:id/history', async (req, res) => {
  try {
    const current = await Visitor.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Visitor not found' });

    const { pool } = require('../utils/db');
    const [candidates] = await pool.execute(`
      SELECT * FROM visitors 
      WHERE id != ? 
        AND (email = ? OR phone = ? OR aadhaarId = ? OR panId = ? OR passportId = ? OR drivingLicenseId = ?)
      ORDER BY checkInTime DESC 
      LIMIT 10
    `, [current.id, current.email, current.phone, current.aadhaarId, current.panId, current.passportId, current.drivingLicenseId]);

    const mappedCandidates = candidates.map(r => ({ ...r, _id: r.id }));
    res.json(mappedCandidates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check out visitor
router.put('/:id/checkout', async (req, res) => {
  try {
    const existing = await Visitor.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Visitor not found' });
    }
    if (existing.status === 'Checked Out') {
      return res.status(400).json({ message: 'Visitor already checked out' });
    }

    const updated = await Visitor.checkout(req.params.id);

    req.app.get('io').emit('visitor-checkout', {
      type: 'checkout',
      visitor: updated,
      timestamp: new Date()
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update visitor within 1-hour correction window, with audit log
router.put('/:id', async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });

    // Enforce 1-hour window while checked in
    const oneHour = 60 * 60 * 1000;
    const withinWindow = visitor.status === 'Checked In' && (Date.now() - new Date(visitor.checkInTime).getTime() <= oneHour);
    if (!withinWindow) {
      return res.status(403).json({ message: 'Edit window expired' });
    }

    const editableFields = ['firstName','lastName','email','phone','company','purpose','notes','aadhaarId','panId','passportId','drivingLicenseId'];
    const changes = [];
    editableFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        const before = visitor[field];
        const after = req.body[field];
        if (after !== undefined && String(before) !== String(after)) {
          visitor[field] = after;
          changes.push({ field, before, after });
        }
      }
    });

    const updated = await Visitor.updateEditable(req.params.id, req.body);

    if (changes.length > 0) {
      // Note: audit log is omitted in SQL version for simplicity
    }

    res.json(visitor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete visitor
router.delete('/:id', async (req, res) => {
  try {
    const ok = await Visitor.deleteById(req.params.id);
    if (!ok) {
      return res.status(404).json({ message: 'Visitor not found' });
    }
    res.json({ message: 'Visitor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;