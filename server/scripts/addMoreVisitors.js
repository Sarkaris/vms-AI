const { pool } = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

async function addMoreVisitors() {
  try {
    console.log('🚀 Adding more visitor data to maximize entries...');
    console.log('================================================');
    
    // Sample visitor data to add
    const additionalVisitors = [
      {
        firstName: 'Michael',
        lastName: 'Johnson',
        email: 'michael.johnson@techcorp.com',
        phone: '+1-555-0101',
        company: 'TechCorp',
        purpose: 'Software Development',
        expectedDuration: 120,
        status: 'Checked In',
        location: 'Development Lab',
        isVip: 0,
        securityLevel: 'Medium',
        temperature: 36.5,
        healthDeclaration: 1,
        notes: 'Working on new project'
      },
      {
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah.williams@designstudio.com',
        phone: '+1-555-0102',
        company: 'Design Studio',
        purpose: 'UI/UX Review',
        expectedDuration: 90,
        status: 'Checked In',
        location: 'Design Office',
        isVip: 0,
        securityLevel: 'Low',
        temperature: 36.4,
        healthDeclaration: 1,
        notes: 'Reviewing new interface designs'
      },
      {
        firstName: 'David',
        lastName: 'Brown',
        email: 'david.brown@securityfirm.com',
        phone: '+1-555-0103',
        company: 'Security Firm',
        purpose: 'Security Audit',
        expectedDuration: 180,
        status: 'Checked In',
        location: 'Security Office',
        isVip: 0,
        securityLevel: 'High',
        temperature: 36.6,
        healthDeclaration: 1,
        notes: 'Quarterly security assessment'
      },
      {
        firstName: 'Lisa',
        lastName: 'Davis',
        email: 'lisa.davis@marketing.com',
        phone: '+1-555-0104',
        company: 'Marketing Agency',
        purpose: 'Campaign Planning',
        expectedDuration: 60,
        status: 'Checked Out',
        location: 'Marketing Office',
        isVip: 0,
        securityLevel: 'Low',
        temperature: 36.3,
        healthDeclaration: 0,
        notes: 'Planning Q4 marketing campaign'
      },
      {
        firstName: 'Robert',
        lastName: 'Miller',
        email: 'robert.miller@consulting.com',
        phone: '+1-555-0105',
        company: 'Consulting Firm',
        purpose: 'Business Analysis',
        expectedDuration: 150,
        status: 'Checked In',
        location: 'Conference Room A',
        isVip: 1,
        securityLevel: 'High',
        temperature: 36.7,
        healthDeclaration: 1,
        notes: 'Strategic business review'
      },
      {
        firstName: 'Jennifer',
        lastName: 'Wilson',
        email: 'jennifer.wilson@hrservices.com',
        phone: '+1-555-0106',
        company: 'HR Services',
        purpose: 'Employee Training',
        expectedDuration: 240,
        status: 'Checked In',
        location: 'Training Room',
        isVip: 0,
        securityLevel: 'Medium',
        temperature: 36.5,
        healthDeclaration: 1,
        notes: 'Conducting leadership training'
      },
      {
        firstName: 'Christopher',
        lastName: 'Moore',
        email: 'christopher.moore@logistics.com',
        phone: '+1-555-0107',
        company: 'Logistics Corp',
        purpose: 'Supply Chain Review',
        expectedDuration: 90,
        status: 'Checked Out',
        location: 'Operations Center',
        isVip: 0,
        securityLevel: 'Medium',
        temperature: 36.4,
        healthDeclaration: 0,
        notes: 'Reviewing supply chain efficiency'
      },
      {
        firstName: 'Amanda',
        lastName: 'Taylor',
        email: 'amanda.taylor@finance.com',
        phone: '+1-555-0108',
        company: 'Finance Group',
        purpose: 'Financial Audit',
        expectedDuration: 300,
        status: 'Checked In',
        location: 'Finance Office',
        isVip: 0,
        securityLevel: 'High',
        temperature: 36.6,
        healthDeclaration: 1,
        notes: 'Annual financial audit'
      },
      {
        firstName: 'James',
        lastName: 'Anderson',
        email: 'james.anderson@legal.com',
        phone: '+1-555-0109',
        company: 'Legal Services',
        purpose: 'Contract Review',
        expectedDuration: 120,
        status: 'Checked In',
        location: 'Legal Office',
        isVip: 0,
        securityLevel: 'High',
        temperature: 36.5,
        healthDeclaration: 1,
        notes: 'Reviewing service contracts'
      },
      {
        firstName: 'Michelle',
        lastName: 'Thomas',
        email: 'michelle.thomas@research.com',
        phone: '+1-555-0110',
        company: 'Research Institute',
        purpose: 'Data Analysis',
        expectedDuration: 180,
        status: 'Checked In',
        location: 'Research Lab',
        isVip: 0,
        securityLevel: 'Medium',
        temperature: 36.4,
        healthDeclaration: 1,
        notes: 'Analyzing research data'
      },
      {
        firstName: 'Daniel',
        lastName: 'Jackson',
        email: 'daniel.jackson@maintenance.com',
        phone: '+1-555-0111',
        company: 'Maintenance Services',
        purpose: 'Equipment Maintenance',
        expectedDuration: 240,
        status: 'Checked In',
        location: 'Maintenance Bay',
        isVip: 0,
        securityLevel: 'Low',
        temperature: 36.3,
        healthDeclaration: 0,
        notes: 'Scheduled equipment maintenance'
      },
      {
        firstName: 'Ashley',
        lastName: 'White',
        email: 'ashley.white@quality.com',
        phone: '+1-555-0112',
        company: 'Quality Assurance',
        purpose: 'Quality Inspection',
        expectedDuration: 90,
        status: 'Checked Out',
        location: 'Quality Lab',
        isVip: 0,
        securityLevel: 'Medium',
        temperature: 36.5,
        healthDeclaration: 1,
        notes: 'Product quality inspection'
      },
      {
        firstName: 'Matthew',
        lastName: 'Harris',
        email: 'matthew.harris@delivery.com',
        phone: '+1-555-0113',
        company: 'Delivery Services',
        purpose: 'Package Delivery',
        expectedDuration: 30,
        status: 'Checked Out',
        location: 'Loading Dock',
        isVip: 0,
        securityLevel: 'Low',
        temperature: 36.4,
        healthDeclaration: 0,
        notes: 'Delivering urgent packages'
      },
      {
        firstName: 'Jessica',
        lastName: 'Martin',
        email: 'jessica.martin@cleaning.com',
        phone: '+1-555-0114',
        company: 'Cleaning Services',
        purpose: 'Office Cleaning',
        expectedDuration: 120,
        status: 'Checked In',
        location: 'Various Offices',
        isVip: 0,
        securityLevel: 'Low',
        temperature: 36.3,
        healthDeclaration: 0,
        notes: 'Regular office cleaning service'
      },
      {
        firstName: 'Kevin',
        lastName: 'Garcia',
        email: 'kevin.garcia@catering.com',
        phone: '+1-555-0115',
        company: 'Catering Services',
        purpose: 'Event Catering',
        expectedDuration: 180,
        status: 'Checked In',
        location: 'Cafeteria',
        isVip: 0,
        securityLevel: 'Low',
        temperature: 36.6,
        healthDeclaration: 1,
        notes: 'Setting up for company event'
      }
    ];
    
    console.log(`Adding ${additionalVisitors.length} additional visitors...`);
    
    for (const visitor of additionalVisitors) {
      const badgeId = uuidv4();
      const checkInTime = new Date();
      const checkOutTime = visitor.status === 'Checked Out' ? new Date(Date.now() + visitor.expectedDuration * 60000) : null;
      
      await pool.execute(`
        INSERT INTO visitors (
          firstName, lastName, email, phone, company, purpose, expectedDuration,
          checkInTime, checkOutTime, status, badgeId, qrCode, photo,
          aadhaarId, panId, passportId, drivingLicenseId, temperature,
          healthDeclaration, notes, location, isVip, securityLevel,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        visitor.firstName,
        visitor.lastName,
        visitor.email,
        visitor.phone,
        visitor.company,
        visitor.purpose,
        visitor.expectedDuration,
        checkInTime,
        checkOutTime,
        visitor.status,
        badgeId,
        badgeId,
        null,
        null,
        null,
        null,
        null,
        visitor.temperature,
        visitor.healthDeclaration,
        visitor.notes,
        visitor.location,
        visitor.isVip,
        visitor.securityLevel,
        new Date(),
        new Date()
      ]);
      
      console.log(`✅ Added visitor: ${visitor.firstName} ${visitor.lastName} (${visitor.status})`);
    }
    
    // Get total count
    const [result] = await pool.execute('SELECT COUNT(*) as count FROM visitors');
    const totalVisitors = result[0].count;
    
    console.log('================================================');
    console.log(`✅ Successfully added ${additionalVisitors.length} visitors!`);
    console.log(`📊 Total visitors in database: ${totalVisitors}`);
    console.log('Your VMS now has maximum visitor entries!');
    
  } catch (error) {
    console.error('❌ Error adding visitors:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  addMoreVisitors()
    .then(() => {
      console.log('🎉 Visitor data addition completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to add visitors:', error);
      process.exit(1);
    });
}

module.exports = { addMoreVisitors };
