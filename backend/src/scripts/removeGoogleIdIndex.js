const mongoose = require('mongoose');

async function removeGoogleIdIndex() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ownquesta');
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    
    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name).join(', '));
    
    // Drop googleId index if exists
    try {
      await collection.dropIndex('googleId_1');
      console.log('✅ Dropped googleId_1 index');
    } catch (e) {
      console.log('⚠️  googleId_1 index does not exist');
    }
    
    // Drop all data
    await collection.deleteMany({});
    console.log('✅ Cleared all users');
    
    // Verify remaining indexes
    const remainingIndexes = await collection.indexes();
    console.log('✅ Remaining indexes:', remainingIndexes.map(i => i.name).join(', '));
    
    console.log('\n✅ Users can now register without errors!');
    console.log('👉 Restart backend and try creating account\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

removeGoogleIdIndex();
