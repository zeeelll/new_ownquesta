// Admin middleware

const requireAdmin = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: "Forbidden: Admin access required" });
};

module.exports = requireAdmin;