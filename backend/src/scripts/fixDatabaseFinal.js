const mongoose = require('mongoose');

async function fixDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ownquesta');
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // Drop users collection completely
    try {
      await db.collection('users').drop();
      console.log('✅ Dropped users collection');
    } catch (e) {
      console.log('⚠️  Collection does not exist, creating new one');
    }
    
    // Create fresh collection
    await db.createCollection('users');
    console.log('✅ Created fresh users collection');
    
    // Create indexes - email must be unique
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    console.log('✅ Created unique index on email');
    
    // Create sparse index for googleId - allows multiple null values
    await db.collection('users').createIndex(
      { googleId: 1 }, 
      { 
        unique: true, 
        sparse: true
      }
    );
    console.log('✅ Created sparse unique index on googleId (allows multiple nulls)');
    
    console.log('\n✅ Database is ready!');
    console.log('👉 Users can now create accounts without errors\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixDatabase();
