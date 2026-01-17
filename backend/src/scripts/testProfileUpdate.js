// Test MongoDB connection and update user profile

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function testUpdate() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB:', process.env.MONGODB_URI);

    // Find a user
    const user = await User.findOne({ email: 'sumitsarodiya7@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found with email: sumitsarodiya7@gmail.com');
      process.exit(1);
    }

    console.log('\n📋 Current user data:');
    console.log('Name:', user.name);
    console.log('Phone:', user.phone);
    console.log('Bio:', user.bio);
    console.log('Company:', user.company);
    console.log('Location:', user.location);

    // Test update
    console.log('\n🔄 Testing profile update...');
    user.phone = '1234567890';
    user.bio = 'Test bio - I am a data scientist';
    user.company = 'Test Company';
    user.location = 'Surat, India';
    user.jobTitle = 'Data Scientist';
    user.department = 'AI/ML';
    user.website = 'https://example.com';
    user.dateOfBirth = '2000-01-01';

    await user.save();
    console.log('✅ User updated successfully!');

    // Fetch again to verify
    const updatedUser = await User.findOne({ email: 'sumitsarodiya7@gmail.com' });
    console.log('\n📋 Updated user data:');
    console.log('Name:', updatedUser.name);
    console.log('Phone:', updatedUser.phone);
    console.log('Bio:', updatedUser.bio);
    console.log('Company:', updatedUser.company);
    console.log('Location:', updatedUser.location);
    console.log('Job Title:', updatedUser.jobTitle);
    console.log('Department:', updatedUser.department);
    console.log('Website:', updatedUser.website);
    console.log('Date of Birth:', updatedUser.dateOfBirth);

    console.log('\n✅ Test completed! Check your MongoDB now.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testUpdate();
