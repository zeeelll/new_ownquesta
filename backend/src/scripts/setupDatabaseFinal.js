const mongoose = require('mongoose');

async function setupDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ownquesta');
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    
    // Clear all users
    await collection.deleteMany({});
    console.log('✅ Cleared all existing users');
    
    // Drop all indexes except _id_
    await collection.dropIndexes();
    console.log('✅ Dropped all indexes');
    
    // Create only email unique index
    await collection.createIndex({ email: 1 }, { unique: true });
    console.log('✅ Created unique index on email');
    
    // Create non-unique index on googleId for faster lookups
    await collection.createIndex({ googleId: 1 });
    console.log('✅ Created non-unique index on googleId (allows duplicates/nulls)');
    
    // Verify indexes
    const indexes = await collection.indexes();
    console.log('\n📋 Final indexes:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''}`);
    });
    
    console.log('\n✅ Database setup complete!');
    console.log('👉 Users can now:');
    console.log('   ✓ Register with email/password (local)');
    console.log('   ✓ Register with Google OAuth');
    console.log('   ✓ Both will be stored without errors\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupDatabase();
