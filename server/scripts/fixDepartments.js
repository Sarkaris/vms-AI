const { pool } = require('../utils/db');

const VALID_DEPARTMENTS = [
  'Anti-Human Trafficking Unit',
  'Antiterrorism Squad',
  'Application Branch',
  'Control Room',
  'Cyber Police Station',
  'District Special Branch',
  'Economic Offences Wing',
  'Local Crime Branch',
  'Mahila Cell',
  'Security Branch',
  'Welfare Branch',
  'Superintendent of Police (SP)',
  'Additional Superintendent of Police (Additional SP)'
];

// Mapping of invalid departments to valid ones
const DEPARTMENT_MAPPING = {
  'Security Review': 'Security Branch',
  'Interview': 'Application Branch',
  'Briefing': 'Control Room',
  'Partnership': 'Economic Offences Wing',
  'Maintenance': 'Welfare Branch',
  'PR Meet': 'Mahila Cell',
  'Logistics': 'Welfare Branch',
  'Complaint Cell': 'Control Room',
  'Software Development': 'Application Branch',
  'UI/UX Review': 'Application Branch',
  'Security Audit': 'Security Branch',
  'Campaign Planning': 'District Special Branch',
  'Business Analysis': 'Economic Offences Wing',
  'Employee Training': 'Welfare Branch',
  'Supply Chain Review': 'Economic Offences Wing',
  'Financial Audit': 'Economic Offences Wing',
  'Contract Review': 'Application Branch',
  'Data Analysis': 'District Special Branch',
  'Equipment Maintenance': 'Welfare Branch',
  'Quality Inspection': 'Security Branch',
  'Package Delivery': 'Welfare Branch',
  'Office Cleaning': 'Welfare Branch',
  'Event Catering': 'Mahila Cell',
  'Procurement': 'Application Branch',
  'Finance': 'Economic Offences Wing'
};

async function fixDepartments() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    console.log('Starting department cleanup...');
    
    // First, get all unique purposes
    const [allPurposes] = await pool.execute(
      'SELECT DISTINCT purpose FROM visitors WHERE purpose IS NOT NULL AND purpose != ""'
    );
    
    console.log('Found purposes:', allPurposes.map(p => p.purpose));
    
    // Find and list invalid departments
    const invalidDepartments = allPurposes
      .map(p => p.purpose)
      .filter(purpose => !VALID_DEPARTMENTS.includes(purpose));
    
    if (invalidDepartments.length === 0) {
      console.log('✅ All departments are already valid!');
      return;
    }
    
    console.log('\nInvalid departments found:');
    invalidDepartments.forEach(dept => console.log(`  - ${dept}`));
    
    // Update invalid departments
    let totalUpdated = 0;
    for (const oldDept of invalidDepartments) {
      // Map to a valid department
      const newDept = DEPARTMENT_MAPPING[oldDept] || 'Control Room';
      
      const [result] = await pool.execute(
        'UPDATE visitors SET purpose = ? WHERE purpose = ?',
        [newDept, oldDept]
      );
      
      console.log(`  Updated "${oldDept}" -> "${newDept}" (${result.affectedRows} records)`);
      totalUpdated += result.affectedRows;
    }
    
    console.log(`\n✅ Successfully updated ${totalUpdated} visitor records!`);
    
    // Verify - get updated counts
    const [verification] = await pool.execute(
      'SELECT purpose, COUNT(*) as count FROM visitors GROUP BY purpose ORDER BY count DESC'
    );
    
    console.log('\nFinal department distribution:');
    verification.forEach(row => {
      console.log(`  ${row.purpose}: ${row.count} visitors`);
    });
    
  } catch (error) {
    console.error('Error fixing departments:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

// Run the script
if (require.main === module) {
  fixDepartments()
    .then(() => {
      console.log('✅ Department fix completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { fixDepartments, VALID_DEPARTMENTS };
