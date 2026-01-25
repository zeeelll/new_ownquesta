// Script to create admin users
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");

async function createAdminUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const adminUsers = [
      {
        name: "Sumit Sarodiya",
        email: "sumit.sarodiya@example.com",
        password: "admin123"
      },
      {
        name: "Zeel Mistry",
        email: "zeel.mistry@example.com",
        password: "admin123"
      }
    ];

    for (const adminData of adminUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: adminData.email });
      if (existingUser) {
        console.log(`User ${adminData.email} already exists, making admin...`);
        existingUser.role = 'admin';
        await existingUser.save();
        console.log(`✅ ${adminData.name} is now an admin`);
        continue;
      }

      // Create new admin user
      const hash = await bcrypt.hash(adminData.password, 10);
      const user = await User.create({
        name: adminData.name,
        email: adminData.email,
        password: hash,
        role: 'admin',
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

      console.log(`✅ Admin user created: ${user.name} (${user.email})`);
    }

    await mongoose.disconnect();
    console.log("✅ Admin users setup complete!");
  } catch (error) {
    console.error("Error:", error);
  }
}

createAdminUsers();