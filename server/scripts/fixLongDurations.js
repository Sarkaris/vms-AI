const { pool } = require('../utils/db');

async function fixLongDurations() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    console.log('Finding visitors with unrealistic durations (>24 hours)...\n');
    
    // Find all visitors with durations > 24 hours (1440 minutes)
    const [longDurationVisitors] = await pool.execute(`
      SELECT 
        id,
        firstName,
        lastName,
        checkInTime,
        checkOutTime,
        TIMESTAMPDIFF(MINUTE, checkInTime, checkOutTime) as duration_minutes,
        status
      FROM visitors 
      WHERE checkOutTime IS NOT NULL 
        AND TIMESTAMPDIFF(MINUTE, checkInTime, checkOutTime) > 1440
      ORDER BY duration_minutes DESC
    `);
    
    console.log(`Found ${longDurationVisitors.length} visitors with durations > 24 hours:\n`);
    
    if (longDurationVisitors.length === 0) {
      console.log('✅ No visitors with unrealistic durations found!');
      return;
    }
    
    // Show the long duration visitors
    longDurationVisitors.slice(0, 10).forEach(v => {
      const durationDays = (v.duration_minutes / 60 / 24).toFixed(1);
      console.log(`  Visitor ID ${v.id}: ${v.firstName} ${v.lastName}`);
      console.log(`    Check-in: ${v.checkInTime}`);
      console.log(`    Check-out: ${v.checkOutTime}`);
      console.log(`    Duration: ${v.duration_minutes} minutes (${durationDays} days)\n`);
    });
    
    let totalFixed = 0;
    
    for (const visitor of longDurationVisitors) {
      // Strategy: Update checkout time to be within 24 hours of check-in
      const checkInDate = new Date(visitor.checkInTime);
      const maxDuration = 12 * 60; // 12 hours maximum
      const newCheckOutTime = new Date(checkInDate.getTime() + maxDuration * 60 * 1000);
      
      await pool.execute(
        'UPDATE visitors SET checkOutTime = ? WHERE id = ?',
        [newCheckOutTime, visitor.id]
      );
      
      const newDuration = ((newCheckOutTime - checkInDate) / 1000 / 60).toFixed(0);
      console.log(`  ✓ Fixed Visitor ID ${visitor.id}: ${visitor.firstName} ${visitor.lastName} (new duration: ${newDuration} minutes)`);
      
      totalFixed++;
    }
    
    console.log(`\n✅ Fixed ${totalFixed} visitor records with unrealistic durations`);
    
    // Calculate new average duration
    const [avgResult] = await pool.execute(`
      SELECT 
        AVG(TIMESTAMPDIFF(MINUTE, checkInTime, checkOutTime)) as avgDuration,
        MIN(TIMESTAMPDIFF(MINUTE, checkInTime, checkOutTime)) as minDuration,
        MAX(TIMESTAMPDIFF(MINUTE, checkInTime, checkOutTime)) as maxDuration,
        COUNT(*) as count
      FROM visitors 
      WHERE checkOutTime IS NOT NULL
    `);
    
    console.log('\nNew statistics:');
    console.log(`  Average duration: ${avgResult[0]?.avgDuration?.toFixed(2) || 0} minutes`);
    console.log(`  Min duration: ${avgResult[0]?.minDuration || 0} minutes`);
    console.log(`  Max duration: ${avgResult[0]?.maxDuration || 0} minutes`);
    console.log(`  Total checked-out visitors: ${avgResult[0]?.count || 0}`);
    
  } catch (error) {
    console.error('Error fixing durations:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

// Run the script
if (require.main === module) {
  fixLongDurations()
    .then(() => {
      console.log('\n✅ Duration fix completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { fixLongDurations };
