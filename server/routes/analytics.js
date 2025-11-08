const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const moment = require('moment');
const { pool } = require('../utils/db');

// Get available filter options
router.get('/filter-options', async (req, res) => {
  try {
    // Get unique departments (from purpose field)
    const [deptRows] = await pool.execute('SELECT DISTINCT purpose FROM visitors WHERE purpose IS NOT NULL AND purpose != ""');
    const departments = deptRows.map(row => row.purpose);
    
    // Get unique visitor types (from company field)
    const [typeRows] = await pool.execute('SELECT DISTINCT company FROM visitors WHERE company IS NOT NULL AND company != ""');
    const visitorTypes = typeRows.map(row => row.company);
    
    // Get unique purposes
    const [purposeRows] = await pool.execute('SELECT DISTINCT purpose FROM visitors WHERE purpose IS NOT NULL AND purpose != ""');
    const purposes = purposeRows.map(row => row.purpose);
    
    // Get unique statuses
    const [statusRows] = await pool.execute('SELECT DISTINCT status FROM visitors WHERE status IS NOT NULL AND status != ""');
    const status = statusRows.map(row => row.status);
    
    // Get unique security levels
    const [securityRows] = await pool.execute('SELECT DISTINCT securityLevel FROM visitors WHERE securityLevel IS NOT NULL AND securityLevel != ""');
    const securityLevels = securityRows.map(row => row.securityLevel);
    
    // Add the new SP designations to the purposes if they don't exist
    if (!purposes.includes('Superintendent of Police (SP)')) {
      purposes.push('Superintendent of Police (SP)');
    }
    if (!purposes.includes('Additional Superintendent of Police (Additional SP)')) {
      purposes.push('Additional Superintendent of Police (Additional SP)');
    }

    res.json({
      departments: departments.sort(),
      visitorTypes: visitorTypes.sort(),
      purposes: purposes.sort(),
      status: status.sort(),
      securityLevels: securityLevels.sort()
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get visitor traffic analytics with advanced filtering
router.get('/traffic', async (req, res) => {
  try {
    const { 
      period = '7d', 
      startDate, 
      endDate,
      departments,
      visitorTypes,
      purposes,
      status,
      securityLevels,
      timeSlots
    } = req.query;
    
    // Build base filter conditions
    const conditions = [];
    const params = [];
    
    // Date filter
    if (startDate && endDate) {
      conditions.push('checkInTime BETWEEN ? AND ?');
      params.push(new Date(startDate), new Date(endDate));
    } else {
      const days = parseInt(period.replace('d', ''));
      const startDate = moment().subtract(days, 'days').startOf('day').toDate();
      conditions.push('checkInTime >= ?');
      params.push(startDate);
    }
    
    // Department filter
    if (departments) {
      const deptArray = Array.isArray(departments) ? departments : departments.split(',');
      const placeholders = deptArray.map(() => '?').join(',');
      conditions.push(`purpose IN (${placeholders})`);
      params.push(...deptArray);
    }
    
    // Visitor type filter
    if (visitorTypes) {
      const typeArray = Array.isArray(visitorTypes) ? visitorTypes : visitorTypes.split(',');
      const placeholders = typeArray.map(() => '?').join(',');
      conditions.push(`company IN (${placeholders})`);
      params.push(...typeArray);
    }
    
    // Purpose filter
    if (purposes) {
      const purposeArray = Array.isArray(purposes) ? purposes : purposes.split(',');
      const placeholders = purposeArray.map(() => '?').join(',');
      conditions.push(`purpose IN (${placeholders})`);
      params.push(...purposeArray);
    }
    
    // Status filter
    if (status) {
      const statusArray = Array.isArray(status) ? status : status.split(',');
      const placeholders = statusArray.map(() => '?').join(',');
      conditions.push(`status IN (${placeholders})`);
      params.push(...statusArray);
    }
    
    // Security level filter
    if (securityLevels) {
      const levelArray = Array.isArray(securityLevels) ? securityLevels : securityLevels.split(',');
      const placeholders = levelArray.map(() => '?').join(',');
      conditions.push(`securityLevel IN (${placeholders})`);
      params.push(...levelArray);
    }
    
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    
    // Hourly traffic data
    const [hourlyData] = await pool.execute(`
      SELECT 
        HOUR(checkInTime) as hour,
        DAYOFWEEK(checkInTime) as day,
        COUNT(*) as count
      FROM visitors 
      ${whereClause}
      GROUP BY HOUR(checkInTime), DAYOFWEEK(checkInTime)
      ORDER BY day, hour
    `, params);
    
    // Daily traffic data
    const [dailyData] = await pool.execute(`
      SELECT 
        YEAR(checkInTime) as year,
        MONTH(checkInTime) as month,
        DAY(checkInTime) as day,
        COUNT(*) as count,
        COALESCE(AVG(CASE 
          WHEN checkOutTime IS NOT NULL AND TIMESTAMPDIFF(MINUTE, checkInTime, checkOutTime) <= 1440
          THEN TIMESTAMPDIFF(MINUTE, checkInTime, checkOutTime)
          ELSE NULL
        END), 0) as avgDuration
      FROM visitors 
      ${whereClause}
      GROUP BY YEAR(checkInTime), MONTH(checkInTime), DAY(checkInTime)
      ORDER BY year, month, day
    `, params);
    
    // Peak hours analysis
    const [peakHours] = await pool.execute(`
      SELECT 
        HOUR(checkInTime) as hour,
        COUNT(*) as count
      FROM visitors 
      ${whereClause}
      GROUP BY HOUR(checkInTime)
      ORDER BY count DESC
      LIMIT 5
    `, params);
    
    // Purpose distribution
    const [purposeData] = await pool.execute(`
      SELECT 
        purpose as _id,
        COUNT(*) as count
      FROM visitors 
      ${whereClause}
      GROUP BY purpose
      ORDER BY count DESC
    `, params);
    
    // Department distribution
    const [departmentData] = await pool.execute(`
      SELECT 
        purpose as _id,
        COUNT(*) as count
      FROM visitors 
      ${whereClause} AND purpose IS NOT NULL AND purpose != ""
      GROUP BY purpose
      ORDER BY count DESC
    `, params);
    
    // Average visit duration (excluding unrealistic durations > 24 hours)
    const [avgDurationResult] = await pool.execute(`
      SELECT 
        AVG(TIMESTAMPDIFF(MINUTE, checkInTime, checkOutTime)) as avgDuration
      FROM visitors 
      ${whereClause} 
        AND checkOutTime IS NOT NULL 
        AND TIMESTAMPDIFF(MINUTE, checkInTime, checkOutTime) <= 1440
    `, params);
    
    // Ensure all avgDuration values are numbers
    const formattedDailyData = (dailyData || []).map(item => ({
      ...item,
      avgDuration: Number(item.avgDuration) || 0
    }));

    res.json({
      hourlyData: hourlyData || [],
      dailyData: formattedDailyData,
      peakHours: peakHours || [],
      purposeData: purposeData || [],
      departmentData: departmentData || [],
      avgDuration: Number(avgDurationResult[0]?.avgDuration) || 0
    });
  } catch (error) {
    console.error('Analytics traffic error:', error);
    res.status(500).json({ 
      message: 'Error fetching traffic analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get real-time dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const today = moment().startOf('day').toDate();
    const now = new Date();
    
    // Current visitors
    const [currentResult] = await pool.execute("SELECT COUNT(*) as count FROM visitors WHERE status = 'Checked In'");
    const currentVisitors = currentResult[0].count;
    
    // Today's visitors
    const [todayResult] = await pool.execute('SELECT COUNT(*) as count FROM visitors WHERE checkInTime >= ?', [today]);
    const todayVisitors = todayResult[0].count;
    
    // Overdue visitors
    const overdueVisitors = await Visitor.getOverdue();
    const overdueCount = overdueVisitors.length;
    
    // Recent check-ins (last hour)
    const oneHourAgo = moment().subtract(1, 'hour').toDate();
    const [recentResult] = await pool.execute('SELECT COUNT(*) as count FROM visitors WHERE checkInTime >= ?', [oneHourAgo]);
    const recentCheckins = recentResult[0].count;
    
    // Top purposes today
    const [topPurposes] = await pool.execute(`
      SELECT 
        purpose as _id,
        COUNT(*) as count
      FROM visitors 
      WHERE checkInTime >= ?
      GROUP BY purpose
      ORDER BY count DESC
      LIMIT 5
    `, [today]);
    
    // Hourly distribution for today
    const [hourlyDistribution] = await pool.execute(`
      SELECT 
        HOUR(checkInTime) as _id,
        COUNT(*) as count
      FROM visitors 
      WHERE checkInTime >= ?
      GROUP BY HOUR(checkInTime)
      ORDER BY _id
    `, [today]);
    
    res.json({
      currentVisitors: currentVisitors || 0,
      todayVisitors: todayVisitors || 0,
      overdueCount: overdueCount || 0,
      recentCheckins: recentCheckins || 0,
      topHosts: [], // Not available in current schema
      popularPurposes: topPurposes || [],
      hourlyDistribution: hourlyDistribution || [],
      lastUpdated: now
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ 
      message: 'Error fetching dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get visitor trends
router.get('/trends', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const days = parseInt(period.replace('d', ''));
    const startDate = moment().subtract(days, 'days').startOf('day').toDate();
    
    const [trends] = await pool.execute(`
      SELECT 
        YEAR(checkInTime) as year,
        MONTH(checkInTime) as month,
        DAY(checkInTime) as day,
        COUNT(*) as visitors,
        COALESCE(AVG(CASE 
          WHEN checkOutTime IS NOT NULL AND TIMESTAMPDIFF(MINUTE, checkInTime, checkOutTime) <= 1440
          THEN TIMESTAMPDIFF(MINUTE, checkInTime, checkOutTime) 
          ELSE NULL 
        END), 0) as avgDuration
      FROM visitors 
      WHERE checkInTime >= ?
      GROUP BY YEAR(checkInTime), MONTH(checkInTime), DAY(checkInTime)
      ORDER BY year, month, day
    `, [startDate]);
    
    // Ensure all avgDuration values are numbers
    const formattedTrends = (trends || []).map(item => ({
      ...item,
      avgDuration: Number(item.avgDuration) || 0
    }));

    res.json(formattedTrends);
  } catch (error) {
    console.error('Analytics trends error:', error);
    res.status(500).json({ 
      message: 'Error fetching trends data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get security insights
router.get('/security', async (req, res) => {
  try {
    const today = moment().startOf('day').toDate();
    
    // Unusual activity patterns (late night/early morning)
    const [unusualVisitors] = await pool.execute(`
      SELECT 
        id,
        firstName,
        lastName,
        checkInTime,
        purpose
      FROM visitors 
      WHERE checkInTime >= ? 
        AND (HOUR(checkInTime) >= 22 OR HOUR(checkInTime) <= 6)
    `, [today]);
    
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM visitors 
      WHERE checkInTime >= ? 
        AND (HOUR(checkInTime) >= 22 OR HOUR(checkInTime) <= 6)
    `, [today]);
    
    const unusualActivity = {
      count: countResult[0]?.count || 0,
      visitors: unusualVisitors || []
    };
    
    // High security level visitors
    const highSecurityVisitors = await Visitor.getCurrentActive();
    const filteredHighSecurity = highSecurityVisitors.filter(v => v.securityLevel === 'High');
    
    // Long duration visits (4+ hours)
    const fourHoursAgo = moment().subtract(4, 'hours').toDate();
    const [longVisits] = await pool.execute(`
      SELECT * FROM visitors 
      WHERE status = 'Checked In' 
        AND checkInTime <= ?
    `, [fourHoursAgo]);
    
    res.json({
      unusualActivity: unusualActivity,
      highSecurityVisitors: filteredHighSecurity || [],
      longVisits: longVisits || []
    });
  } catch (error) {
    console.error('Analytics security error:', error);
    res.status(500).json({ 
      message: 'Error fetching security insights',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Sidebar quick stats and recent activity
router.get('/sidebar', async (req, res) => {
  try {
    const todayStart = moment().startOf('day').toDate();

    // Current visitors
    const [currentResult] = await pool.execute("SELECT COUNT(*) as count FROM visitors WHERE status = 'Checked In'");
    const currentVisitors = currentResult[0].count;
    
    // Today's total
    const [todayResult] = await pool.execute('SELECT COUNT(*) as count FROM visitors WHERE checkInTime >= ?', [todayStart]);
    const todayTotal = todayResult[0].count;
    
    // Recent visitors
    const [recentVisitors] = await pool.execute(`
      SELECT firstName, lastName, status, checkInTime, checkOutTime
      FROM visitors 
      ORDER BY checkInTime DESC 
      LIMIT 6
    `);

    const recent = recentVisitors.map(v => ({
      name: `${v.firstName} ${v.lastName}`.trim(),
      action: v.status === 'Checked In' ? 'checked in' : (v.status === 'Checked Out' ? 'checked out' : v.status?.toLowerCase() || 'updated'),
      at: v.status === 'Checked In' ? v.checkInTime : (v.checkOutTime || v.checkInTime)
    }));

    res.json({
      currentVisitors: currentVisitors || 0,
      todayTotal: todayTotal || 0,
      recentActivity: recent || []
    });
  } catch (error) {
    console.error('Analytics sidebar error:', error);
    res.status(500).json({
      message: 'Error fetching sidebar data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;