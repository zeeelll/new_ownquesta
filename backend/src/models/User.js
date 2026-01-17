// User model

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String },
    provider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, default: null },
    avatar: { type: String, default: "" },
    phone: { type: String, default: "" },
    dateOfBirth: { type: String, default: "" },
    bio: { type: String, default: "" },
    company: { type: String, default: "" },
    jobTitle: { type: String, default: "" },
    location: { type: String, default: "" },
    department: { type: String, default: "" },
    website: { type: String, default: "" },
    emailNotif: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false },
    publicProfile: { type: Boolean, default: true },
    twoFactorAuth: { type: Boolean, default: false },
    language: { type: String, default: "en" },
    timezone: { type: String, default: "UTC" },
    isActive: { type: Boolean, default: true },
    role: { type: String, default: "user" },
    subscription: { type: String, default: "free" },
    settings: {
      emailNotif: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false },
      publicProfile: { type: Boolean, default: true },
      twoFactorAuth: { type: Boolean, default: false },
      language: { type: String, default: "en" },
      timezone: { type: String, default: "UTC" }
    },
    lastLogin: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
