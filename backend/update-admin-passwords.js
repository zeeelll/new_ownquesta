// Script to update admin passwords
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");

async function updateAdminPasswords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const newPassword = "admin@2026";
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update Sumit Sarodiya's password
    const sumitUser = await User.findOneAndUpdate(
      { email: "sumitsarodiya@gmail.com" },
      { password: hashedPassword },
      { new: true }
    );

    if (sumitUser) {
      console.log(`✅ Updated Sumit Sarodiya's password`);
    } else {
      console.log("❌ Sumit Sarodiya user not found");
    }

    // Update Zeel Mistry's password
    const zeelUser = await User.findOneAndUpdate(
      { email: "zeelmistry@gmail.com" },
      { password: hashedPassword },
      { new: true }
    );

    if (zeelUser) {
      console.log(`✅ Updated Zeel Mistry's password`);
    } else {
      console.log("❌ Zeel Mistry user not found");
    }

    await mongoose.disconnect();
    console.log("✅ Admin password updates complete!");
  } catch (error) {
    console.error("Error:", error);
  }
}

updateAdminPasswords();