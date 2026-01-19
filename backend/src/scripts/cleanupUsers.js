// Script to cleanup duplicate users
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ownquesta';

async function cleanup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Find all users
    const users = await collection.find({}).toArray();
    console.log(`\nTotal users: ${users.length}`);

    // Find users with null googleId
    const nullGoogleIdUsers = users.filter(u => u.googleId === null);
    console.log(`Users with googleId=null: ${nullGoogleIdUsers.length}`);

    if (nullGoogleIdUsers.length > 1) {
      console.log('\n⚠️  Multiple users with null googleId found. Keeping the latest one...');
      
      // Sort by creation date and keep the latest
      nullGoogleIdUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Delete older duplicates
      for (let i = 1; i < nullGoogleIdUsers.length; i++) {
        await collection.deleteOne({ _id: nullGoogleIdUsers[i]._id });
        console.log(`Deleted user: ${nullGoogleIdUsers[i].email}`);
      }
      
      console.log('✅ Cleanup completed!');
    } else {
      console.log('✅ No duplicate users found.');
    }

    // Drop all indexes and recreate them properly
    console.log('\nRecreating indexes...');
    await collection.dropIndexes();
    await collection.createIndex({ email: 1 }, { unique: true });
    await collection.createIndex({ googleId: 1 }, { unique: true, sparse: true });
    console.log('✅ Indexes recreated successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanup();
