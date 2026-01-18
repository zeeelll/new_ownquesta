// Auth controller

const bcrypt = require("bcryptjs");
const passport = require("passport");
const User = require("../models/User");
const speakeasy = require('speakeasy');
const { sendWelcomeEmail } = require("../utils/email");

const sendNotificationEmail = async (to, subject, html) => {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log('Notification email sent to', to);
  } catch (error) {
    console.error('Error sending notification email:', error);
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already used" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hash,
      provider: "local",
      avatar: "",
      phone: "",
      bio: "",
      company: "",
      jobTitle: "",
      location: "",
      skills: "",
      settings: {
        emailNotif: true,
        darkMode: true,
        twoFactorAuth: false
      },
      twoFactorSecret: null
    });

    console.log("✅ New user registered:", user._id);

    // Automatically log in the user after registration
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error("❌ Auto-login after registration failed:", loginErr);
        return res.status(500).json({ message: "Registration successful but login failed. Please login manually." });
      }
      
      console.log("✅ User auto-logged in after registration");
      const userObj = user.toObject();
      delete userObj.password;
      res.status(201).json({ message: "Registered successfully", user: userObj });
    });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.login = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info?.message || "Login failed" });

    req.logIn(user, async (err2) => {
      if (err2) return next(err2);
      // Send welcome email asynchronously
      sendWelcomeEmail(user.email, user.name);
      return res.json({ message: "Login success", user });
    });
  })(req, res, next);
};

exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("❌ Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        console.error("❌ Session destroy error:", destroyErr);
        return res.status(500).json({ message: "Session destruction failed" });
      }
      res.clearCookie('connect.sid');
      console.log("✅ User logged out successfully");
      res.json({ message: "Logged out" });
    });
  });
};

exports.me = (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  
  const userObj = req.user.toObject();
  delete userObj.password;
  
  console.log("👤 User profile requested:", req.user._id);
  res.json({ user: userObj });
};

exports.check = (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) return res.sendStatus(200);
  return res.sendStatus(401);
};

exports.updateProfile = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    console.log("📝 Updating profile for user:", req.user._id);
    console.log("📦 Update data:", req.body);

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update individual fields
    const fields = ['name', 'phone', 'bio', 'company', 'jobTitle', 'location', 'skills', 'avatar'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    // Update settings object
    if (req.body.settings) {
      user.settings = { ...user.settings, ...req.body.settings };
    }

    await user.save();

    console.log("✅ Profile updated successfully");

    // Send notification email if email notifications are enabled
    if (user.settings.emailNotif) {
      await sendNotificationEmail(user.email, 'Profile Updated', `<h1>Hi ${user.name},</h1><p>Your profile has been updated successfully.</p><p>Best,<br>Ownquesta Team</p>`);
    }

    const userObj = user.toObject();
    delete userObj.password;
    res.json({ message: "Profile updated successfully", user: userObj });
  } catch (err) {
    console.error("❌ Profile update error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Change password: expects { currentPassword, newPassword }
exports.changePassword = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Missing fields' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.password) return res.status(400).json({ message: 'Password change not supported for this account' });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('❌ Change password error:', err);
    res.status(500).json({ message: err.message });
  }
};

// 2FA setup - returns secret base32 (keep server-side minimal; store secret only after verification)
exports.setup2fa = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const secret = speakeasy.generateSecret({ length: 20 });
    // Return the base32 secret and otpauth URL for QR generation on client
    res.json({ secret: secret.base32, otpauth_url: secret.otpauth_url });
  } catch (err) {
    console.error('❌ 2FA setup error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Verify a TOTP code and enable 2FA when valid. Expects { token, secret } .
exports.verify2fa = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { token, secret } = req.body;
    if (!token || !secret) return res.status(400).json({ message: 'Missing token or secret' });

    const verified = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
    if (!verified) return res.status(400).json({ verified: false, message: 'Invalid code' });

    // store secret and enable 2fa
    const user = await User.findById(req.user._id);
    user.twoFactorSecret = secret;
    user.twoFactorAuth = true;
    if (!user.settings) user.settings = {};
    user.settings.twoFactorAuth = true;
    await user.save();

    res.json({ verified: true, message: 'Two-factor authentication enabled' });
  } catch (err) {
    console.error('❌ 2FA verify error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Disable 2FA
exports.disable2fa = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(req.user._id);
    user.twoFactorSecret = null;
    user.twoFactorAuth = false;
    if (!user.settings) user.settings = {};
    user.settings.twoFactorAuth = false;
    await user.save();
    res.json({ message: 'Two-factor authentication disabled' });
  } catch (err) {
    console.error('❌ 2FA disable error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Delete account: expects { password }
exports.deleteAccount = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Password required' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.password) return res.status(400).json({ message: 'Account does not support password verification' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Password incorrect' });

    // delete user
    await User.findByIdAndDelete(req.user._id);

    // logout and destroy session
    req.logout((err) => {
      if (err) console.error('Logout after delete error:', err);
      try {
        req.session.destroy(() => {});
      } catch (e) {}
    });

    res.json({ message: 'Account deleted' });
  } catch (err) {
    console.error('❌ Delete account error:', err);
    res.status(500).json({ message: err.message });
  }
};
