const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  },
  debug: true,
  logger: true
});

const sendWelcomeEmail = async (to, name) => {
  const mailOptions = {
    from: `"Ownquesta" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Welcome to Ownquesta!',
    html: `
      <h1>Welcome, ${name}!</h1>
      <p>Thank you for logging in to Ownquesta. We're excited to have you here.</p>
      <p>Explore our features and start building something extraordinary today.</p>
      <p>Best regards,<br>The Ownquesta Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to', to);
    return { ok: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { ok: false, error };
  }
};

const sendNotificationEmail = async (to, subject, html) => {
  const mailOptions = {
    from: `"Ownquesta" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    // Verify transporter configuration (will throw if config invalid)
    await transporter.verify();
  } catch (err) {
    console.error('Email transporter verification failed:', err);
    return { ok: false, error: err };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Notification email sent to', to, 'messageId=', info.messageId);
    return { ok: true, info };
  } catch (error) {
    console.error('Error sending notification email:', error);
    return { ok: false, error };
  }
};

module.exports = { sendWelcomeEmail, sendNotificationEmail, transporter };