// Setup automatic email service for testing
const nodemailer = require('nodemailer');

async function setupTestEmail() {
  try {
    console.log('Setting up email service...\n');
    
    // Create a test account with Ethereal Email
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('✅ Test email account created!\n');
    console.log('SMTP Configuration:');
    console.log('==========================================');
    console.log('EMAIL_HOST=' + testAccount.smtp.host);
    console.log('EMAIL_PORT=' + testAccount.smtp.port);
    console.log('EMAIL_SECURE=' + testAccount.smtp.secure);
    console.log('EMAIL_USER=' + testAccount.user);
    console.log('EMAIL_PASS=' + testAccount.pass);
    console.log('EMAIL_FROM=' + testAccount.user);
    console.log('==========================================\n');
    
    // Test sending an email
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    console.log('Sending test email...');
    
    const info = await transporter.sendMail({
      from: testAccount.user,
      to: 'test@example.com',
      subject: 'Test OTP - Ownquesta',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8b5cf6;">Password Reset Request</h2>
          <p>Your OTP code is: <strong style="font-size: 24px; color: #8b5cf6;">123456</strong></p>
          <p>This is a test email to verify the system works.</p>
        </div>
      `,
    });
    
    console.log('✅ Test email sent successfully!\n');
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    console.log('\n📧 You can view the email at the URL above');
    console.log('\n⚠️  NOTE: This is a test email service.');
    console.log('For production, replace with your Gmail credentials in .env file\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupTestEmail();
