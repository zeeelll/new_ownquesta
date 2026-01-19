// Test script for welcome email functionality
require('dotenv').config();
const mongoose = require('mongoose');
const { sendWelcomeEmail } = require('../utils/email');

const testWelcomeEmail = async () => {
  try {
    console.log('🧪 Testing Welcome Email Configuration...\n');
    
    // Check environment variables
    console.log('📋 Environment Check:');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');
    console.log('');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ Email credentials not configured in .env file');
      process.exit(1);
    }
    
    // Connect to database
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected\n');
    
    // Get test email from command line or use default
    const testEmail = process.argv[2] || process.env.EMAIL_USER;
    const testName = 'Test User';
    
    console.log(`📧 Sending welcome email to: ${testEmail}`);
    console.log(`👤 Name: ${testName}\n`);
    
    const result = await sendWelcomeEmail(testEmail, testName);
    
    if (result && result.ok) {
      console.log('✅ SUCCESS! Welcome email sent successfully');
      console.log('📬 Check your inbox (and spam folder) for the welcome email');
    } else {
      console.error('❌ FAILED! Could not send welcome email');
      console.error('Error:', result?.error);
    }
    
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
};

testWelcomeEmail();
