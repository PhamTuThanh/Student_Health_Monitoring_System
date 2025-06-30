import mongoose from 'mongoose';
import physicalFitnessModel from '../models/physicalFitnessModel.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clean up duplicate records
const cleanupDuplicates = async () => {
  try {
    console.log('Starting cleanup of duplicate physical fitness records...');
    
    // Find all records
    const allRecords = await physicalFitnessModel.find({});
    console.log(`Total records found: ${allRecords.length}`);
    
    // Group by studentId and examSessionId
    const groupedRecords = {};
    
    allRecords.forEach(record => {
      const key = `${record.studentId}-${record.examSessionId}`;
      if (!groupedRecords[key]) {
        groupedRecords[key] = [];
      }
      groupedRecords[key].push(record);
    });
    
    let duplicatesRemoved = 0;
    let duplicateGroups = 0;
    
    // Process each group
    for (const [key, records] of Object.entries(groupedRecords)) {
      if (records.length > 1) {
        duplicateGroups++;
        console.log(`\nFound ${records.length} duplicates for key: ${key}`);
        
        // Sort by creation date, keep the newest one
        records.sort((a, b) => new Date(b.createdAt || b._id.getTimestamp()) - new Date(a.createdAt || a._id.getTimestamp()));
        
        const recordToKeep = records[0];
        const recordsToDelete = records.slice(1);
        
        console.log(`Keeping record: ${recordToKeep._id}`);
        console.log(`Deleting ${recordsToDelete.length} duplicate(s):`);
        
        for (const record of recordsToDelete) {
          console.log(`  - Deleting: ${record._id} (studentId: ${record.studentId})`);
          await physicalFitnessModel.findByIdAndDelete(record._id);
          duplicatesRemoved++;
        }
      }
    }
    
    console.log('\n=== Cleanup Summary ===');
    console.log(`Total duplicate groups found: ${duplicateGroups}`);
    console.log(`Total duplicate records removed: ${duplicatesRemoved}`);
    console.log(`Remaining records: ${allRecords.length - duplicatesRemoved}`);
    
    // Verify no duplicates remain
    const finalRecords = await physicalFitnessModel.find({});
    const finalGrouped = {};
    
    finalRecords.forEach(record => {
      const key = `${record.studentId}-${record.examSessionId}`;
      if (!finalGrouped[key]) {
        finalGrouped[key] = [];
      }
      finalGrouped[key].push(record);
    });
    
    const remainingDuplicates = Object.values(finalGrouped).filter(group => group.length > 1);
    
    if (remainingDuplicates.length === 0) {
      console.log('✅ Cleanup successful! No duplicates remain.');
    } else {
      console.log(`⚠️ Warning: ${remainingDuplicates.length} duplicate groups still exist.`);
    }
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await cleanupDuplicates();
  await mongoose.disconnect();
  console.log('Cleanup completed and database disconnected.');
};

main().catch(console.error); 