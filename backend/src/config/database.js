// Database configuration

const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI not set in .env file");
    console.log("Please add: MONGODB_URI=mongodb://localhost:27017/ownquesta");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
    
    // Log when documents are saved
    mongoose.set('debug', true);
    
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.log("Make sure MongoDB is running: mongod");
    process.exit(1);
  }
};

module.exports = connectDB;
