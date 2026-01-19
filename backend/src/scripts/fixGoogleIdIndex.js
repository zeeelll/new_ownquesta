// Script to fix googleId index issue
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ownquesta';

async function fixIndex() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Drop the problematic index
    try {
      await collection.dropIndex('googleId_1');
      console.log('✅ Dropped googleId_1 index successfully');
    } catch (err) {
      if (err.code === 27) {
        console.log('Index googleId_1 does not exist, skipping...');
      } else {
        throw err;
      }
    }

    // Create a sparse unique index for googleId (allows multiple null values)
    await collection.createIndex({ googleId: 1 }, { unique: true, sparse: true });
    console.log('✅ Created sparse unique index on googleId');

    console.log('✅ Index fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing index:', error);
    process.exit(1);
  }
}

fixIndex();
