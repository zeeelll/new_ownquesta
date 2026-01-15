// Database configuration

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ Mongo Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ Mongo connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
