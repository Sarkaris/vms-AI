const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { pool, ensureSchema } = require('../utils/db');
const bcrypt = require('bcryptjs');

async function importCompleteData() {
  try {
    console.log('🚀 Starting Complete Data Import (JSON + CSV)...');
    console.log('================================================');
    
    // Ensure database schema exists
    await ensureSchema();
    console.log('✅ Database schema ensured');
    
    // Clear existing data
    await pool.execute('DELETE FROM emergencies');
    await pool.execute('DELETE FROM visitors');
    await pool.execute('DELETE FROM admins');
    console.log('✅ Cleared existing data');
    
    // Import admins from JSON
    await importAdminsFromJson();
    
    // Import visitors from CSV
    await importVisitorsFromCsv();
    
    // Import emergencies from CSV
    await importEmergenciesFromCsv();
    
    console.log('================================================');
    console.log('✅ Complete data import finished successfully!');
    console.log('Your VMS application now has all data in MySQL.');
    
  } catch (error) {
    console.log('================================================');
    console.error('❌ Data import failed:', error.message);
    throw error;
  }
}

async function importAdminsFromJson() {
  const jsonPath = path.join(__dirname, '../../test database/CyberX.admins.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.log('⚠️  CyberX.admins.json not found, skipping admins...');
    return;
  }
  
  console.log('📥 Importing admins from JSON...');
  
  try {
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const admins = JSON.parse(jsonData);
    
    console.log(`Found ${admins.length} admins to import`);
    
    for (const admin of admins) {
      const adminData = {
        username: admin.username,
        email: admin.email,
        password: admin.password, // Already hashed from MongoDB
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        department: admin.department,
        permissions: JSON.stringify(admin.permissions),
        isActive: admin.isActive ? 1 : 0,
        lastLogin: admin.lastLogin ? new Date(admin.lastLogin.$date) : null,
        loginAttempts: admin.loginAttempts || 0,
        lockUntil: null,
        createdAt: admin.createdAt ? new Date(admin.createdAt.$date) : new Date(),
        updatedAt: admin.updatedAt ? new Date(admin.updatedAt.$date) : new Date()
      };
      
      await pool.execute(`
        INSERT INTO admins (
          username, email, password, firstName, lastName, role, department, 
          permissions, isActive, lastLogin, loginAttempts, lockUntil, 
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        adminData.username,
        adminData.email,
        adminData.password,
        adminData.firstName,
        adminData.lastName,
        adminData.role,
        adminData.department,
        adminData.permissions,
        adminData.isActive,
        adminData.lastLogin,
        adminData.loginAttempts,
        adminData.lockUntil,
        adminData.createdAt,
        adminData.updatedAt
      ]);
      
      console.log(`✅ Imported admin: ${adminData.firstName} ${adminData.lastName} (${adminData.role})`);
    }
    
    console.log(`✅ Successfully imported ${admins.length} admins from JSON`);
    
  } catch (error) {
    console.error('❌ Error importing admins from JSON:', error.message);
    throw error;
  }
}

async function importVisitorsFromCsv() {
  const csvPath = path.join(__dirname, '../../test database/visitors.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️  visitors.csv not found, skipping visitors...');
    return;
  }
  
  console.log('📥 Importing visitors from CSV...');
  
  return new Promise((resolve, reject) => {
    const visitors = [];
    
    fs.createReadStream(csvPath)
      .pipe(csv({ separator: ';' }))
      .on('data', (row) => {
        visitors.push(row);
      })
      .on('end', async () => {
        try {
          console.log(`Found ${visitors.length} visitors to import`);
          
          for (const visitor of visitors) {
            // Handle empty or null values properly
            const visitorData = {
              firstName: visitor.firstName || 'Unknown',
              lastName: visitor.lastName || 'Visitor',
              email: visitor.email || '',
              phone: visitor.phone || '',
              company: visitor.company || null,
              purpose: visitor.purpose || 'General Visit',
              expectedDuration: parseInt(visitor.expectedDuration) || 60,
              checkInTime: visitor.checkInTime ? new Date(visitor.checkInTime) : new Date(),
              checkOutTime: visitor.checkOutTime ? new Date(visitor.checkOutTime) : null,
              status: visitor.status || 'Checked In',
              badgeId: visitor.badgeId || require('uuid').v4(),
              qrCode: visitor.qrCode || visitor.badgeId || '',
              photo: visitor.photo || null,
              aadhaarId: visitor.aadhaarId || null,
              panId: visitor.panId || null,
              passportId: visitor.passportId || null,
              drivingLicenseId: visitor.drivingLicenseId || null,
              temperature: visitor.temperature ? parseFloat(visitor.temperature) : null,
              healthDeclaration: visitor.healthDeclaration === '1' || visitor.healthDeclaration === 1 ? 1 : 0,
              notes: visitor.notes || null,
              location: visitor.location || 'Main Lobby',
              isVip: visitor.isVip === '1' || visitor.isVip === 1 ? 1 : 0,
              securityLevel: visitor.securityLevel || 'Low',
              createdAt: visitor.createdAt ? new Date(visitor.createdAt) : new Date(),
              updatedAt: visitor.updatedAt ? new Date(visitor.updatedAt) : new Date()
            };
            
            await pool.execute(`
              INSERT INTO visitors (
                firstName, lastName, email, phone, company, purpose, expectedDuration,
                checkInTime, checkOutTime, status, badgeId, qrCode, photo,
                aadhaarId, panId, passportId, drivingLicenseId, temperature,
                healthDeclaration, notes, location, isVip, securityLevel,
                createdAt, updatedAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              visitorData.firstName,
              visitorData.lastName,
              visitorData.email,
              visitorData.phone,
              visitorData.company,
              visitorData.purpose,
              visitorData.expectedDuration,
              visitorData.checkInTime,
              visitorData.checkOutTime,
              visitorData.status,
              visitorData.badgeId,
              visitorData.qrCode,
              visitorData.photo,
              visitorData.aadhaarId,
              visitorData.panId,
              visitorData.passportId,
              visitorData.drivingLicenseId,
              visitorData.temperature,
              visitorData.healthDeclaration,
              visitorData.notes,
              visitorData.location,
              visitorData.isVip,
              visitorData.securityLevel,
              visitorData.createdAt,
              visitorData.updatedAt
            ]);
            
            console.log(`✅ Imported visitor: ${visitorData.firstName} ${visitorData.lastName} (${visitorData.status})`);
          }
          
          console.log(`✅ Successfully imported ${visitors.length} visitors from CSV`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function importEmergenciesFromCsv() {
  const csvPath = path.join(__dirname, '../../test database/emergency.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️  emergency.csv not found, skipping emergencies...');
    return;
  }
  
  console.log('📥 Importing emergencies from CSV...');
  
  return new Promise((resolve, reject) => {
    const emergencies = [];
    
    fs.createReadStream(csvPath)
      .pipe(csv({ separator: ';' }))
      .on('data', (row) => {
        emergencies.push(row);
      })
      .on('end', async () => {
        try {
          console.log(`Found ${emergencies.length} emergencies to import`);
          
          for (const emergency of emergencies) {
            // Handle empty or null values properly
            const emergencyData = {
              type: emergency.type || 'Visitor',
              location: emergency.location || 'Main Lobby',
              notes: emergency.notes || null,
              status: emergency.status || 'Active',
              incidentCode: emergency.incidentCode || `EMG-${Date.now()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`,
              departmentName: emergency.departmentName || null,
              groupName: emergency.groupName || null,
              pocName: emergency.pocName || null,
              pocPhone: emergency.pocPhone || null,
              representativeIdDocument: emergency.representativeIdDocument || null,
              representativeIdNumber: emergency.representativeIdNumber || null,
              headcount: emergency.headcount ? parseInt(emergency.headcount) : null,
              visitorFirstName: emergency.visitorFirstName || null,
              visitorLastName: emergency.visitorLastName || null,
              visitorPhone: emergency.visitorPhone || null,
              reason: emergency.reason || null,
              isMinor: emergency.isMinor === '1' || emergency.isMinor === 1 ? 1 : 0,
              guardianContact: emergency.guardianContact || null,
              createdBy: emergency.createdBy ? parseInt(emergency.createdBy) : null,
              resolvedBy: emergency.resolvedBy ? parseInt(emergency.resolvedBy) : null,
              resolvedAt: emergency.resolvedAt ? new Date(emergency.resolvedAt) : null,
              createdAt: emergency.createdAt ? new Date(emergency.createdAt) : new Date(),
              updatedAt: emergency.updatedAt ? new Date(emergency.updatedAt) : new Date()
            };
            
            await pool.execute(`
              INSERT INTO emergencies (
                type, location, notes, status, incidentCode, departmentName, groupName,
                pocName, pocPhone, representativeIdDocument, representativeIdNumber,
                headcount, visitorFirstName, visitorLastName, visitorPhone, reason,
                isMinor, guardianContact, createdBy, resolvedBy, resolvedAt,
                createdAt, updatedAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              emergencyData.type,
              emergencyData.location,
              emergencyData.notes,
              emergencyData.status,
              emergencyData.incidentCode,
              emergencyData.departmentName,
              emergencyData.groupName,
              emergencyData.pocName,
              emergencyData.pocPhone,
              emergencyData.representativeIdDocument,
              emergencyData.representativeIdNumber,
              emergencyData.headcount,
              emergencyData.visitorFirstName,
              emergencyData.visitorLastName,
              emergencyData.visitorPhone,
              emergencyData.reason,
              emergencyData.isMinor,
              emergencyData.guardianContact,
              emergencyData.createdBy,
              emergencyData.resolvedBy,
              emergencyData.resolvedAt,
              emergencyData.createdAt,
              emergencyData.updatedAt
            ]);
            
            console.log(`✅ Imported emergency: ${emergencyData.incidentCode} (${emergencyData.type})`);
          }
          
          console.log(`✅ Successfully imported ${emergencies.length} emergencies from CSV`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

// Run import if called directly
if (require.main === module) {
  importCompleteData()
    .then(() => {
      console.log('🎉 Complete data import finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Data import failed:', error);
      process.exit(1);
    });
}

module.exports = { importCompleteData };
