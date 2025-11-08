#!/usr/bin/env node

const { importCompleteData } = require('./importCompleteData');

console.log('🚀 Starting Complete VMS Data Import (JSON + CSV)...');
console.log('====================================================');

importCompleteData()
  .then(() => {
    console.log('====================================================');
    console.log('✅ Complete data import finished successfully!');
    console.log('Your VMS application now has all data in MySQL:');
    console.log('');
    console.log('📊 Imported Data:');
    console.log('- Admins from CyberX.admins.json (MongoDB export)');
    console.log('- Visitors from visitors.csv');
    console.log('- Emergencies from emergency.csv');
    console.log('');
    console.log('Next steps:');
    console.log('1. Make sure XAMPP MySQL is running');
    console.log('2. Start the server: npm start');
    console.log('3. Access the application at http://localhost:3000');
    console.log('');
    console.log('Default login credentials from your JSON:');
    console.log('- Email: admin@gmail.com');
    console.log('- Password: (use the original password from your MongoDB)');
    process.exit(0);
  })
  .catch((error) => {
    console.log('====================================================');
    console.error('❌ Complete data import failed:', error.message);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Make sure XAMPP MySQL is running');
    console.log('2. Check your database credentials in .env file');
    console.log('3. Ensure the database exists');
    console.log('4. Verify the data files exist:');
    console.log('   - test database/CyberX.admins.json');
    console.log('   - test database/visitors.csv');
    console.log('   - test database/emergency.csv');
    process.exit(1);
  });
