// User model

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    provider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, default: null },
    avatar: { type: String, default: "" },
    phone: { type: String, default: "" },
    bio: { type: String, default: "" },
    company: { type: String, default: "" },
    jobTitle: { type: String, default: "" },
    location: { type: String, default: "" },
    skills: { type: String, default: "" },
    settings: {
      emailNotif: { type: Boolean, default: true },
      darkMode: { type: Boolean, default: true },
      twoFactorAuth: { type: Boolean, default: false }
    },
    twoFactorSecret: { type: String, default: null },
    resetOtp: { type: String, default: null },
    resetOtpExpiry: { type: Date, default: null },
    firstLogin: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
