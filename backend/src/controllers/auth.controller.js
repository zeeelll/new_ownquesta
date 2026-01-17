// Auth controller

const bcrypt = require("bcryptjs");
const passport = require("passport");
const User = require("../models/User");

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
      dateOfBirth: "",
      bio: "",
      company: "",
      jobTitle: "",
      location: "",
      department: "",
      website: "",
      emailNotif: true,
      marketingEmails: false,
      publicProfile: true,
      twoFactorAuth: false,
      language: "en",
      timezone: "UTC",
      isActive: true,
      role: "user",
      subscription: "free",
      settings: {
        emailNotif: true,
        marketingEmails: false,
        publicProfile: true,
        twoFactorAuth: false,
        language: "en",
        timezone: "UTC"
      }
    });

    console.log("✅ New user registered:", user._id);

    res.status(201).json({ message: "Registered successfully", user });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.login = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info?.message || "Login failed" });

    req.logIn(user, (err2) => {
      if (err2) return next(err2);
      return res.json({ message: "Login success", user });
    });
  })(req, res, next);
};

exports.logout = (req, res) => {
  req.logout(() => {
    res.json({ message: "Logged out" });
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

    const {
      name,
      phone,
      dateOfBirth,
      bio,
      company,
      jobTitle,
      location,
      department,
      website,
      avatar,
      emailNotif,
      marketingEmails,
      publicProfile,
      twoFactorAuth,
      language,
      timezone
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (bio !== undefined) updateData.bio = bio;
    if (company !== undefined) updateData.company = company;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
    if (location !== undefined) updateData.location = location;
    if (department !== undefined) updateData.department = department;
    if (website !== undefined) updateData.website = website;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (emailNotif !== undefined) updateData.emailNotif = emailNotif;
    if (marketingEmails !== undefined) updateData.marketingEmails = marketingEmails;
    if (publicProfile !== undefined) updateData.publicProfile = publicProfile;
    if (twoFactorAuth !== undefined) updateData.twoFactorAuth = twoFactorAuth;
    if (language !== undefined) updateData.language = language;
    if (timezone !== undefined) updateData.timezone = timezone;

    console.log("💾 Saving to database:", updateData);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    console.log("✅ Profile updated successfully");

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    console.error("❌ Profile update error:", err);
    res.status(500).json({ message: err.message });
  }
};
