#!/usr/bin/env node

const { migrateData } = require('./migrateData');

console.log('🚀 Starting VMS Data Migration to MySQL...');
console.log('=====================================');

migrateData()
  .then(() => {
    console.log('=====================================');
    console.log('✅ Migration completed successfully!');
    console.log('Your VMS application is now ready to use with MySQL.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Make sure XAMPP MySQL is running');
    console.log('2. Start the server: npm start');
    console.log('3. Access the application at http://localhost:3000');
    process.exit(0);
  })
  .catch((error) => {
    console.log('=====================================');
    console.error('❌ Migration failed:', error.message);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Make sure XAMPP MySQL is running');
    console.log('2. Check your database credentials in .env file');
    console.log('3. Ensure the database exists');
    process.exit(1);
  });
