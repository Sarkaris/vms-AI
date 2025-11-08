const { getDB, query, run } = require('./databaseWrapper');

function initDemoDatabase() {
  return new Promise((resolve, reject) => {
    try {
      // Initialize the database wrapper
      const db = getDB();
      console.log('✅ Demo SQLite database connected (in-memory)');
      createDemoTables().then(resolve).catch(reject);
    } catch (err) {
      console.error('❌ Error creating demo database:', err);
      reject(err);
    }
  });
}

async function createDemoTables() {
  try {
    const tables = [
      `CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Admin',
        department TEXT NOT NULL,
        permissions TEXT,
        isActive INTEGER NOT NULL DEFAULT 1,
        lastLogin TEXT,
        loginAttempts INTEGER NOT NULL DEFAULT 0,
        lockUntil TEXT,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS visitors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        company TEXT,
        purpose TEXT NOT NULL,
        expectedDuration INTEGER NOT NULL DEFAULT 60,
        checkInTime TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        checkOutTime TEXT,
        status TEXT NOT NULL DEFAULT 'Checked In',
        badgeId TEXT NOT NULL UNIQUE,
        qrCode TEXT,
        photo TEXT,
        aadhaarId TEXT,
        panId TEXT,
        passportId TEXT,
        drivingLicenseId TEXT,
        temperature REAL,
        healthDeclaration INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        location TEXT NOT NULL DEFAULT 'Main Lobby',
        isVip INTEGER NOT NULL DEFAULT 0,
        securityLevel TEXT NOT NULL DEFAULT 'Low',
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS emergencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        location TEXT,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'Active',
        incidentCode TEXT NOT NULL UNIQUE,
        departmentName TEXT,
        groupName TEXT,
        pocName TEXT,
        pocPhone TEXT,
        representativeIdDocument TEXT,
        representativeIdNumber TEXT,
        headcount INTEGER,
        visitorFirstName TEXT,
        visitorLastName TEXT,
        visitorPhone TEXT,
        reason TEXT,
        isMinor INTEGER NOT NULL DEFAULT 0,
        guardianContact TEXT,
        createdBy INTEGER,
        resolvedBy INTEGER,
        resolvedAt TEXT,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    // Create tables sequentially
    for (const sql of tables) {
      await run(sql);
    }
    
    console.log('✅ Demo tables created successfully');
    await insertDemoData();
  } catch (err) {
    console.error('❌ Error creating tables:', err);
    throw err;
  }
}

async function insertDemoData() {
  try {
    const demoData = require('./demoData');
    
    // Insert demo admin
    const adminSql = `INSERT INTO admins (username, email, password, firstName, lastName, role, department, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    try {
      await run(adminSql, ['demo', 'demo@vms.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Demo', 'User', 'Super Admin', 'IT', 1]);
    } catch (err) {
      if (!err.message.includes('UNIQUE constraint failed')) {
        console.error('❌ Error inserting demo admin:', err);
      }
    }
    
    // Insert additional demo admin with ID 123 and password 123
    try {
      await run(adminSql, ['123', 'admin123@vms.com', '$2a$10$dgdVdaXS/MCCjVAAG3yciOZ0LnveGkIVFkYjhJCZVbUGS5ka.1BFC', 'Admin', 'User', 'Admin', 'IT', 1]);
    } catch (err) {
      if (!err.message.includes('UNIQUE constraint failed')) {
        console.error('❌ Error inserting admin 123:', err);
      }
    }

    // Insert demo visitors
    const visitorSql = `INSERT INTO visitors (firstName, lastName, email, phone, company, purpose, badgeId, status, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const demoVisitors = demoData.visitors;
    
    let visitorCount = 0;
    for (const visitor of demoVisitors) {
      try {
        await run(visitorSql, [visitor.firstName, visitor.lastName, visitor.email, visitor.phone, visitor.company, visitor.purpose, visitor.badgeId, visitor.status, visitor.location]);
        visitorCount++;
      } catch (err) {
        console.error('❌ Error inserting demo visitor:', err);
      }
    }
    console.log(`✅ ${visitorCount} demo visitors inserted`);
    
    // Insert demo emergencies
    const emergencySql = `INSERT INTO emergencies (type, location, notes, status, incidentCode, departmentName) VALUES (?, ?, ?, ?, ?, ?)`;
    const demoEmergencies = demoData.emergencies;
    
    let emergencyCount = 0;
    for (const emergency of demoEmergencies) {
      try {
        await run(emergencySql, [emergency.type, emergency.location, emergency.notes, emergency.status, emergency.incidentCode, emergency.departmentName]);
        emergencyCount++;
      } catch (err) {
        console.error('❌ Error inserting demo emergency:', err);
      }
    }
    console.log(`✅ ${emergencyCount} demo emergencies inserted`);
  } catch (err) {
    console.error('❌ Error inserting demo data:', err);
    throw err;
  }
}

// Export database functions
module.exports = {
  initDemoDatabase
};