const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendWelcomeEmail = async (to, name) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
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
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

module.exports = { sendWelcomeEmail };