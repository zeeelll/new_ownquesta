require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailConnection() {
  console.log('🔍 Testing email configuration...\n');
  
  console.log('📧 Email Settings:');
  console.log('  User:', process.env.EMAIL_USER);
  console.log('  Password:', process.env.EMAIL_PASS ? '****' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET');
  console.log('');

  // Test 1: Using service: 'gmail' (recommended)
  console.log('Test 1: Using Gmail service (port 587, STARTTLS)');
  const transporter1 = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 30000,
    debug: true,
    logger: true
  });

  try {
    console.log('  ⏳ Verifying connection...');
    await transporter1.verify();
    console.log('  ✅ Gmail service connection successful!\n');
    
    // Send test email
    console.log('  📧 Sending test email...');
    const info = await transporter1.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: '✅ Ownquesta Email Test - Success!',
      text: 'This is a test email from Ownquesta. Your email configuration is working correctly!',
      html: '<h1>✅ Success!</h1><p>Your email configuration is working correctly!</p>'
    });
    console.log('  ✅ Test email sent successfully!');
    console.log('  📬 Message ID:', info.messageId);
    console.log('  ✅ Your email is configured correctly!\n');
    return true;
  } catch (error) {
    console.error('  ❌ Test 1 failed:', error.message);
    console.log('');
  }

  // Test 2: Port 587 with explicit settings
  console.log('Test 2: Using SMTP with port 587 (STARTTLS)');
  const transporter2 = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });

  try {
    console.log('  ⏳ Verifying connection...');
    await transporter2.verify();
    console.log('  ✅ Port 587 connection successful!\n');
    
    // Send test email
    console.log('  📧 Sending test email...');
    const info = await transporter2.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: '✅ Ownquesta Email Test - Port 587 Success!',
      text: 'This is a test email using port 587. Your email configuration is working!',
      html: '<h1>✅ Success with Port 587!</h1><p>Your email configuration is working correctly!</p>'
    });
    console.log('  ✅ Test email sent successfully!');
    console.log('  📬 Message ID:', info.messageId);
    console.log('  ✅ Your email is configured correctly!\n');
    return true;
  } catch (error) {
    console.error('  ❌ Test 2 failed:', error.message);
    console.log('');
  }

  // Test 3: Port 465 with SSL
  console.log('Test 3: Using SMTP with port 465 (SSL)');
  const transporter3 = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });

  try {
    console.log('  ⏳ Verifying connection...');
    await transporter3.verify();
    console.log('  ✅ Port 465 connection successful!\n');
    
    // Send test email
    console.log('  📧 Sending test email...');
    const info = await transporter3.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: '✅ Ownquesta Email Test - Port 465 Success!',
      text: 'This is a test email using port 465. Your email configuration is working!',
      html: '<h1>✅ Success with Port 465!</h1><p>Your email configuration is working correctly!</p>'
    });
    console.log('  ✅ Test email sent successfully!');
    console.log('  📬 Message ID:', info.messageId);
    console.log('  ✅ Your email is configured correctly!\n');
    return true;
  } catch (error) {
    console.error('  ❌ Test 3 failed:', error.message);
    console.log('');
  }

  // All tests failed
  console.log('\n❌ All tests failed. Please check:');
  console.log('');
  console.log('📋 Troubleshooting Steps:');
  console.log('1. ✅ Verify you are using a Gmail App Password (not your regular password)');
  console.log('   - Go to: https://myaccount.google.com/apppasswords');
  console.log('   - Generate a new App Password for "Mail"');
  console.log('   - Update EMAIL_PASS in your .env file');
  console.log('');
  console.log('2. ✅ Enable 2-Step Verification on your Google account');
  console.log('   - Go to: https://myaccount.google.com/security');
  console.log('   - Enable 2-Step Verification (required for App Passwords)');
  console.log('');
  console.log('3. ✅ Check your firewall/antivirus settings');
  console.log('   - Allow outgoing connections on ports 465, 587, and 25');
  console.log('   - Temporarily disable firewall to test');
  console.log('');
  console.log('4. ✅ Check if your ISP blocks SMTP ports');
  console.log('   - Some ISPs block outgoing port 25, 465, or 587');
  console.log('   - Try using a VPN or different network');
  console.log('');
  console.log('5. ✅ Verify the email address in .env');
  console.log('   - Current EMAIL_USER:', process.env.EMAIL_USER);
  console.log('   - Make sure it matches the account used for the App Password');
  console.log('');
  
  return false;
}

// Run the test
testEmailConnection()
  .then(success => {
    if (success) {
      console.log('🎉 Email configuration is working perfectly!');
      process.exit(0);
    } else {
      console.log('❌ Email configuration needs attention.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('💥 Unexpected error:', err);
    process.exit(1);
  });
