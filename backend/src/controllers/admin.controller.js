// Admin controller

const User = require("../models/User");
const ActivityService = require("../services/activity.service");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -twoFactorSecret -resetOtp -resetOtpExpiry');
    res.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -twoFactorSecret -resetOtp -resetOtpExpiry');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, phone, bio, company, jobTitle, location, skills } = req.body;
    const oldUser = await User.findById(req.params.id);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, phone, bio, company, jobTitle, location, skills },
      { new: true }
    ).select('-password -twoFactorSecret -resetOtp -resetOtpExpiry');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Log the admin action
    await ActivityService.logActivity(
      user._id,
      user.email,
      user.name,
      'admin_update_profile',
      `Profile updated by admin ${req.user.name}`,
      req,
      {
        oldData: {
          name: oldUser.name,
          email: oldUser.email,
          role: oldUser.role,
          phone: oldUser.phone,
          company: oldUser.company
        },
        newData: {
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          company: user.company
        }
      }
    );

    res.json({ user });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Log the deletion before removing
    await ActivityService.logActivity(
      user._id,
      user.email,
      user.name,
      'admin_delete_account',
      `Account deleted by admin ${req.user.name}`,
      req,
      {
        deletedUser: {
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }
      }
    );

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.makeAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'admin' },
      { new: true }
    ).select('-password -twoFactorSecret -resetOtp -resetOtpExpiry');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Log the role change
    await ActivityService.logActivity(
      user._id,
      user.email,
      user.name,
      'admin_role_change',
      `Promoted to admin by ${req.user.name}`,
      req,
      { newRole: 'admin', changedBy: req.user.name }
    );

    res.json({ user });
  } catch (error) {
    console.error("Error making user admin:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.removeAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'user' },
      { new: true }
    ).select('-password -twoFactorSecret -resetOtp -resetOtpExpiry');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Log the role change
    await ActivityService.logActivity(
      user._id,
      user.email,
      user.name,
      'admin_role_change',
      `Admin role removed by ${req.user.name}`,
      req,
      { newRole: 'user', changedBy: req.user.name }
    );

    res.json({ user });
  } catch (error) {
    console.error("Error removing admin role:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user activities
exports.getUserActivities = async (req, res) => {
  try {
    const activities = await ActivityService.getUserActivities(req.params.id);
    res.json({ activities });
  } catch (error) {
    console.error("Error fetching user activities:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all activities (recent)
exports.getAllActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;
    const activities = await ActivityService.getAllActivities(limit, skip);
    res.json({ activities });
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ message: "Server error" });
  }
};