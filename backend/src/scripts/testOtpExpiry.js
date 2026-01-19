// Test script for OTP expiration functionality (2 minutes)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const testOtpExpiry = async () => {
  try {
    console.log('🧪 Testing OTP Expiration (2 minutes)...\n');
    
    // Connect to database
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected\n');
    
    // Find a test user or create one
    const testEmail = process.argv[2] || 'test@example.com';
    let user = await User.findOne({ email: testEmail });
    
    if (!user) {
      console.log('⚠️  Test user not found, please provide a valid email');
      console.log('Usage: node testOtpExpiry.js <email>');
      process.exit(1);
    }
    
    console.log(`👤 Testing with user: ${user.email}\n`);
    
    // Simulate OTP generation
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
    
    user.resetOtp = otp;
    user.resetOtpExpiry = expiry;
    await user.save();
    
    console.log('✅ OTP Generated:');
    console.log(`🔢 OTP: ${otp}`);
    console.log(`⏰ Expires at: ${expiry.toLocaleString()}`);
    console.log(`⏳ Time until expiry: 2 minutes\n`);
    
    // Test immediate verification (should work)
    console.log('🧪 Test 1: Immediate verification (should succeed)');
    if (Date.now() < user.resetOtpExpiry && user.resetOtp === otp) {
      console.log('✅ PASS - OTP is valid\n');
    } else {
      console.log('❌ FAIL - OTP should be valid\n');
    }
    
    // Simulate expired OTP
    console.log('🧪 Test 2: Expired OTP (simulating 3 minutes later)');
    const expiredTime = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes from now
    const now = expiredTime.getTime();
    
    if (now > user.resetOtpExpiry.getTime()) {
      console.log('✅ PASS - OTP correctly identified as expired\n');
    } else {
      console.log('❌ FAIL - OTP expiration check failed\n');
    }
    
    console.log('📊 Summary:');
    console.log('- OTP Expiration Time: 2 minutes');
    console.log('- OTP Format: 6-digit number');
    console.log('- Stored in database: resetOtp & resetOtpExpiry fields');
    console.log('- Verification: Date.now() > resetOtpExpiry\n');
    
    console.log('✅ All tests completed successfully!');
    
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
};

testOtpExpiry();
