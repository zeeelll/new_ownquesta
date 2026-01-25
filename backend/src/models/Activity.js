// Activity model for tracking user actions

const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    action: { type: String, required: true }, // e.g., 'login', 'update_profile', 'upload_dataset', etc.
    description: { type: String, required: true }, // Human-readable description
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed }, // Additional data about the action
    adminChangedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // If changed by admin
    adminEmail: { type: String }, // Admin who made the change
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Index for efficient queries
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ timestamp: -1 });
activitySchema.index({ action: 1 });

module.exports = mongoose.model("Activity", activitySchema);