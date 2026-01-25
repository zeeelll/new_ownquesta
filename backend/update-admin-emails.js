// Script to update admin email addresses
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

async function updateAdminEmails() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Update Sumit Sarodiya's email
    const sumitUser = await User.findOneAndUpdate(
      { email: "sumit.sarodiya@example.com" },
      { email: "sumitsarodiya@gmail.com" },
      { new: true }
    );

    if (sumitUser) {
      console.log(`✅ Updated Sumit Sarodiya's email: ${sumitUser.email}`);
    } else {
      console.log("❌ Sumit Sarodiya user not found");
    }

    // Update Zeel Mistry's email
    const zeelUser = await User.findOneAndUpdate(
      { email: "zeel.mistry@example.com" },
      { email: "zeelmistry@gmail.com" },
      { new: true }
    );

    if (zeelUser) {
      console.log(`✅ Updated Zeel Mistry's email: ${zeelUser.email}`);
    } else {
      console.log("❌ Zeel Mistry user not found");
    }

    await mongoose.disconnect();
    console.log("✅ Admin email updates complete!");
  } catch (error) {
    console.error("Error:", error);
  }
}

updateAdminEmails();