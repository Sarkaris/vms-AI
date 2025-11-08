const mongoose = require('mongoose');
const Visitor = require('../models/Visitor');

// Migration script to convert legacy idDocument/idNumber/alternateIds to new ID structure
async function migrateVisitorIds() {
  try {
    console.log('Starting visitor ID migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor-management');
    console.log('Connected to MongoDB');

    // Find all visitors with legacy ID structure
    const visitors = await Visitor.find({
      $or: [
        { idDocument: { $exists: true } },
        { idNumber: { $exists: true } },
        { alternateIds: { $exists: true } }
      ]
    });

    console.log(`Found ${visitors.length} visitors to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const visitor of visitors) {
      try {
        let hasChanges = false;
        const updateData = {};

        // Migrate primary idDocument/idNumber to appropriate field
        if (visitor.idDocument && visitor.idNumber) {
          const idNumber = visitor.idNumber.toString().trim();
          if (idNumber) {
            switch (visitor.idDocument) {
              case 'Aadhaar Card':
                if (!visitor.aadhaarId) {
                  updateData.aadhaarId = idNumber;
                  hasChanges = true;
                }
                break;
              case 'PAN':
                if (!visitor.panId) {
                  updateData.panId = idNumber.toUpperCase();
                  hasChanges = true;
                }
                break;
              case 'Passport':
                if (!visitor.passportId) {
                  updateData.passportId = idNumber.toUpperCase();
                  hasChanges = true;
                }
                break;
              case 'Driving License':
                if (!visitor.drivingLicenseId) {
                  updateData.drivingLicenseId = idNumber.toUpperCase();
                  hasChanges = true;
                }
                break;
            }
          }
        }

        // Migrate alternateIds to appropriate fields
        if (visitor.alternateIds && visitor.alternateIds.size > 0) {
          const alternateIds = visitor.alternateIds;
          
          // Handle both old and new key formats
          const idMappings = [
            { key: 'aadhaarId', altKeys: ['aadhaarId', 'Aadhaar Card'] },
            { key: 'panId', altKeys: ['panId', 'PAN'] },
            { key: 'passportId', altKeys: ['passportId', 'Passport'] },
            { key: 'drivingLicenseId', altKeys: ['drivingLicenseId', 'Driving License'] }
          ];

          for (const mapping of idMappings) {
            if (!visitor[mapping.key]) {
              for (const altKey of mapping.altKeys) {
                const value = alternateIds.get(altKey);
                if (value && value.toString().trim()) {
                  let processedValue = value.toString().trim();
                  
                  // Normalize based on ID type
                  if (mapping.key === 'aadhaarId') {
                    processedValue = processedValue.replace(/\D/g, '');
                  } else {
                    processedValue = processedValue.toUpperCase();
                  }
                  
                  updateData[mapping.key] = processedValue;
                  hasChanges = true;
                  break; // Use first valid value found
                }
              }
            }
          }
        }

        // Apply updates if there are changes
        if (hasChanges) {
          // Remove legacy fields
          updateData.$unset = {
            idDocument: 1,
            idNumber: 1,
            alternateIds: 1
          };

          await Visitor.findByIdAndUpdate(visitor._id, updateData);
          migratedCount++;
          console.log(`Migrated visitor: ${visitor.firstName} ${visitor.lastName} (${visitor._id})`);
        } else {
          skippedCount++;
          console.log(`Skipped visitor: ${visitor.firstName} ${visitor.lastName} (${visitor._id}) - no changes needed`);
        }

      } catch (error) {
        console.error(`Error migrating visitor ${visitor._id}:`, error.message);
      }
    }

    console.log(`\nMigration completed!`);
    console.log(`- Migrated: ${migratedCount} visitors`);
    console.log(`- Skipped: ${skippedCount} visitors`);
    console.log(`- Total processed: ${visitors.length} visitors`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateVisitorIds()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateVisitorIds;
