const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { pool, ensureSchema } = require('../utils/db');
const bcrypt = require('bcryptjs');

async function migrateData() {
  try {
    console.log('Starting data migration...');
    
    // Ensure database schema exists
    await ensureSchema();
    console.log('Database schema ensured');
    
    // Clear existing data
    await pool.execute('DELETE FROM emergencies');
    await pool.execute('DELETE FROM visitors');
    await pool.execute('DELETE FROM admins');
    console.log('Cleared existing data');
    
    // Migrate admins
    await migrateAdmins();
    
    // Migrate visitors
    await migrateVisitors();
    
    // Migrate emergencies
    await migrateEmergencies();
    
    console.log('Data migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function migrateAdmins() {
  const csvPath = path.join(__dirname, '../../test database/admin.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('Admin CSV not found, skipping...');
    return;
  }
  
  console.log('Migrating admins...');
  
  return new Promise((resolve, reject) => {
    const admins = [];
    
    fs.createReadStream(csvPath)
      .pipe(csv({ separator: ';' }))
      .on('data', (row) => {
        admins.push(row);
      })
      .on('end', async () => {
        try {
          for (const admin of admins) {
            const hashedPassword = await bcrypt.hash(admin.password || 'admin123', 10);
            
            await pool.execute(`
              INSERT INTO admins (username, email, password, firstName, lastName, role, department, permissions, isActive, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              admin.username || admin.email || 'admin',
              admin.email || 'admin@example.com',
              hashedPassword,
              admin.firstName || 'Admin',
              admin.lastName || 'User',
              admin.role || 'Admin',
              admin.department || 'IT',
              JSON.stringify({
                canViewAnalytics: true,
                canManageVisitors: true,
                canManageAdmins: admin.role === 'Super Admin',
                canExportData: true,
                canViewReports: true
              }),
              1,
              new Date(),
              new Date()
            ]);
          }
          
          console.log(`Migrated ${admins.length} admins`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function migrateVisitors() {
  const csvPath = path.join(__dirname, '../../test database/visitors.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('Visitors CSV not found, skipping...');
    return;
  }
  
  console.log('Migrating visitors...');
  
  return new Promise((resolve, reject) => {
    const visitors = [];
    
    fs.createReadStream(csvPath)
      .pipe(csv({ separator: ';' }))
      .on('data', (row) => {
        visitors.push(row);
      })
      .on('end', async () => {
        try {
          for (const visitor of visitors) {
            const badgeId = visitor.badgeId || require('uuid').v4();
            const checkInTime = visitor.checkInTime ? new Date(visitor.checkInTime) : new Date();
            const checkOutTime = visitor.checkOutTime ? new Date(visitor.checkOutTime) : null;
            
            await pool.execute(`
              INSERT INTO visitors (
                firstName, lastName, email, phone, company, purpose, expectedDuration,
                checkInTime, checkOutTime, status, badgeId, qrCode, photo,
                aadhaarId, panId, passportId, drivingLicenseId, temperature,
                healthDeclaration, notes, location, isVip, securityLevel,
                createdAt, updatedAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              visitor.firstName || 'Unknown',
              visitor.lastName || 'Visitor',
              visitor.email || '',
              visitor.phone || '',
              visitor.company || null,
              visitor.purpose || 'General Visit',
              parseInt(visitor.expectedDuration) || 60,
              checkInTime,
              checkOutTime,
              visitor.status || 'Checked In',
              badgeId,
              visitor.qrCode || badgeId,
              visitor.photo || null,
              visitor.aadhaarId || null,
              visitor.panId || null,
              visitor.passportId || null,
              visitor.drivingLicenseId || null,
              visitor.temperature ? parseFloat(visitor.temperature) : null,
              visitor.healthDeclaration === 'true' ? 1 : 0,
              visitor.notes || null,
              visitor.location || 'Main Lobby',
              visitor.isVip === 'true' ? 1 : 0,
              visitor.securityLevel || 'Low',
              new Date(),
              new Date()
            ]);
          }
          
          console.log(`Migrated ${visitors.length} visitors`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function migrateEmergencies() {
  const csvPath = path.join(__dirname, '../../test database/emergency.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('Emergency CSV not found, skipping...');
    return;
  }
  
  console.log('Migrating emergencies...');
  
  return new Promise((resolve, reject) => {
    const emergencies = [];
    
    fs.createReadStream(csvPath)
      .pipe(csv({ separator: ';' }))
      .on('data', (row) => {
        emergencies.push(row);
      })
      .on('end', async () => {
        try {
          for (const emergency of emergencies) {
            const incidentCode = emergency.incidentCode || `EMG-${Date.now()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
            const createdAt = emergency.createdAt ? new Date(emergency.createdAt) : new Date();
            const resolvedAt = emergency.resolvedAt ? new Date(emergency.resolvedAt) : null;
            
            await pool.execute(`
              INSERT INTO emergencies (
                type, location, notes, status, incidentCode, departmentName, groupName,
                pocName, pocPhone, representativeIdDocument, representativeIdNumber,
                headcount, visitorFirstName, visitorLastName, visitorPhone, reason,
                isMinor, guardianContact, createdBy, resolvedBy, resolvedAt,
                createdAt, updatedAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              emergency.type || 'Visitor',
              emergency.location || 'Main Lobby',
              emergency.notes || null,
              emergency.status || 'Active',
              incidentCode,
              emergency.departmentName || null,
              emergency.groupName || null,
              emergency.pocName || null,
              emergency.pocPhone || null,
              emergency.representativeIdDocument || null,
              emergency.representativeIdNumber || null,
              emergency.headcount ? parseInt(emergency.headcount) : null,
              emergency.visitorFirstName || null,
              emergency.visitorLastName || null,
              emergency.visitorPhone || null,
              emergency.reason || null,
              emergency.isMinor === 'true' ? 1 : 0,
              emergency.guardianContact || null,
              emergency.createdBy ? parseInt(emergency.createdBy) : null,
              emergency.resolvedBy ? parseInt(emergency.resolvedBy) : null,
              resolvedAt,
              createdAt,
              new Date()
            ]);
          }
          
          console.log(`Migrated ${emergencies.length} emergencies`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

// Run migration if called directly
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateData };
