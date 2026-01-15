// User model

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String }, // only for local users
    provider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, default: null },
    avatar: { type: String, default: "" },
    lastLogin: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
