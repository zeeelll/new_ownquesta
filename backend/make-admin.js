// Script to make a user admin
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

async function makeAdmin(email) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true }
    );

    if (user) {
      console.log(`✅ User ${user.email} is now an admin`);
    } else {
      console.log("❌ User not found");
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run with: node make-admin.js user@example.com
const email = process.argv[2];
if (!email) {
  console.log("Usage: node make-admin.js <email>");
  process.exit(1);
}

makeAdmin(email);