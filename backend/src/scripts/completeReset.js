// Complete database reset for user collection
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ownquesta';

async function completeReset() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Step 1: Show current state
    const count = await collection.countDocuments();
    console.log(`Current users in database: ${count}`);

    // Step 2: Drop entire collection (removes all users and indexes)
    await collection.drop().catch(() => console.log('Collection does not exist, creating new...'));
    console.log('✅ Dropped users collection\n');

    // Step 3: Recreate collection with proper indexes
    await db.createCollection('users');
    console.log('✅ Created fresh users collection');

    // Step 4: Create indexes
    await collection.createIndex({ email: 1 }, { unique: true });
    console.log('✅ Created unique index on email');

    await collection.createIndex({ googleId: 1 }, { unique: true, sparse: true });
    console.log('✅ Created sparse unique index on googleId');

    console.log('\n✅ Database reset completed successfully!');
    console.log('👉 Now restart your backend server and create a new account.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

completeReset();
