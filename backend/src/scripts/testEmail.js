// Test email configuration
require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Testing Email Configuration...\n');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '****' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function testEmail() {
  try {
    console.log('Step 1: Verifying transporter...');
    await transporter.verify();
    console.log('✅ Transporter verified successfully!\n');

    console.log('Step 2: Sending test email...');
    const testOTP = '123456';
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'Test OTP - Ownquesta',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8b5cf6;">Password Reset Request</h2>
          <p>This is a test email.</p>
          <p>Your OTP code is: <strong style="font-size: 24px; color: #8b5cf6;">${testOTP}</strong></p>
          <p><strong style="color: #dc2626;">⚠️ This code will expire in 2 minutes.</strong> Please use it immediately.</p>
          <br>
          <p>Best regards,<br>Ownquesta Team</p>
        </div>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('\n✅ Email configuration is working!');
    console.log('👉 Check your inbox:', process.env.EMAIL_USER);
    
  } catch (error) {
    console.error('\n❌ Email test failed!');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n🔴 Authentication failed!');
      console.error('Solutions:');
      console.error('1. Make sure 2-Step Verification is enabled in Google Account');
      console.error('2. Generate a new App Password at: https://myaccount.google.com/apppasswords');
      console.error('3. Copy the 16-character password (remove spaces)');
      console.error('4. Update EMAIL_PASS in .env file');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
      console.error('\n🔴 Connection failed!');
      console.error('Check your internet connection');
    }
  }
}

testEmail();
