// Activity service for logging user actions

const Activity = require("../models/Activity");

class ActivityService {
  // Log user activity
  static async logActivity(userId, userEmail, userName, action, description, req = null, metadata = {}) {
    try {
      const activityData = {
        userId,
        userEmail,
        userName,
        action,
        description,
        metadata,
        timestamp: new Date()
      };

      // Add request info if available
      if (req) {
        activityData.ipAddress = req.ip || req.connection?.remoteAddress;
        activityData.userAgent = req.get('User-Agent');
      }

      // If this is an admin action, log who made the change
      if (req && req.user && req.user.role === 'admin') {
        activityData.adminChangedBy = req.user._id;
        activityData.adminEmail = req.user.email;
      }

      const activity = new Activity(activityData);
      await activity.save();

      console.log(`📝 Activity logged: ${action} by ${userName} (${userEmail})`);
    } catch (error) {
      console.error('❌ Error logging activity:', error);
    }
  }

  // Get activities for a specific user
  static async getUserActivities(userId, limit = 50) {
    try {
      return await Activity.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('adminChangedBy', 'name email');
    } catch (error) {
      console.error('❌ Error fetching user activities:', error);
      return [];
    }
  }

  // Get all activities (admin only)
  static async getAllActivities(limit = 100, skip = 0) {
    try {
      return await Activity.find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .populate('adminChangedBy', 'name email');
    } catch (error) {
      console.error('❌ Error fetching all activities:', error);
      return [];
    }
  }

  // Get recent activities for dashboard
  static async getRecentActivities(limit = 20) {
    try {
      return await Activity.find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('adminChangedBy', 'name email');
    } catch (error) {
      console.error('❌ Error fetching recent activities:', error);
      return [];
    }
  }
}

module.exports = ActivityService;