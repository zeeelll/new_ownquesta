// Simple SMTP connection test
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testConnection() {
  console.log('🧪 Testing SMTP Connection...\n');
  
  console.log('Configuration:');
  console.log('Host:', process.env.EMAIL_HOST || 'smtp.gmail.com');
  console.log('Port:', process.env.EMAIL_PORT || '465');
  console.log('User:', process.env.EMAIL_USER);
  console.log('');

  // Try port 465 with SSL
  console.log('📡 Attempting connection on port 465 (SSL)...');
  const transporter465 = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
  });

  try {
    await transporter465.verify();
    console.log('✅ Port 465 (SSL): SUCCESS!');
    console.log('✅ Email is configured correctly and ready to send.\n');
    return true;
  } catch (err) {
    console.log('❌ Port 465 (SSL): FAILED');
    console.log('Error:', err.message);
    console.log('');
  }

  // Try port 587 with STARTTLS
  console.log('📡 Attempting connection on port 587 (STARTTLS)...');
  const transporter587 = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
  });

  try {
    await transporter587.verify();
    console.log('✅ Port 587 (STARTTLS): SUCCESS!');
    console.log('✅ Email is configured correctly and ready to send.\n');
    return true;
  } catch (err) {
    console.log('❌ Port 587 (STARTTLS): FAILED');
    console.log('Error:', err.message);
    console.log('');
  }

  console.log('⚠️  DIAGNOSIS:');
  console.log('Both ports failed. Possible causes:');
  console.log('1. Firewall or antivirus blocking SMTP connections');
  console.log('2. ISP blocking outbound SMTP ports');
  console.log('3. Network restrictions');
  console.log('4. Invalid Gmail App Password');
  console.log('');
  console.log('💡 SOLUTIONS:');
  console.log('1. Check Windows Firewall settings');
  console.log('2. Temporarily disable antivirus and test');
  console.log('3. Regenerate Gmail App Password');
  console.log('4. Try from a different network');
  
  return false;
}

testConnection()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
