// Database configuration

const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("⚠️ MONGODB_URI not set — skipping DB connection (dev mode)");
    return;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ Mongo Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ Mongo connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
