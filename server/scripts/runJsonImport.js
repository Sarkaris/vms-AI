#!/usr/bin/env node

const { importJsonData } = require('./importJsonData');

console.log('🚀 Starting VMS JSON Data Import from MongoDB Export...');
console.log('======================================================');

importJsonData()
  .then(() => {
    console.log('======================================================');
    console.log('✅ JSON import completed successfully!');
    console.log('Your VMS application now has the MongoDB data in MySQL.');
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
    console.log('======================================================');
    console.error('❌ JSON import failed:', error.message);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Make sure XAMPP MySQL is running');
    console.log('2. Check your database credentials in .env file');
    console.log('3. Ensure the database exists');
    console.log('4. Verify the JSON file exists at: test database/CyberX.admins.json');
    process.exit(1);
  });
