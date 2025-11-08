const fs = require('fs');
const path = require('path');
const { pool, ensureSchema } = require('../utils/db');
const bcrypt = require('bcryptjs');

async function importJsonData() {
  try {
    console.log('🚀 Starting JSON data import from MongoDB export...');
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
    
    console.log('================================================');
    console.log('✅ JSON data import completed successfully!');
    console.log('Your VMS application now has the MongoDB data in MySQL.');
    
  } catch (error) {
    console.log('================================================');
    console.error('❌ JSON import failed:', error.message);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Make sure XAMPP MySQL is running');
    console.log('2. Check your database credentials in .env file');
    console.log('3. Ensure the database exists');
    throw error;
  }
}

async function importAdminsFromJson() {
  const jsonPath = path.join(__dirname, '../../test database/CyberX.admins.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.log('❌ CyberX.admins.json not found, skipping...');
    return;
  }
  
  console.log('📥 Importing admins from JSON...');
  
  try {
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const admins = JSON.parse(jsonData);
    
    console.log(`Found ${admins.length} admins to import`);
    
    for (const admin of admins) {
      // Convert MongoDB ObjectId to MySQL auto-increment ID
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
        lockUntil: null, // Reset lock status
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

// Run import if called directly
if (require.main === module) {
  importJsonData()
    .then(() => {
      console.log('🎉 JSON import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 JSON import failed:', error);
      process.exit(1);
    });
}

module.exports = { importJsonData };
