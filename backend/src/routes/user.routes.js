// User routes

const router = require("express").Router();
const requireAuth = require("../middleware/auth.middleware");

router.get("/dashboard", requireAuth, (req, res) => {
  res.json({ message: "Welcome Dashboard ✅", user: req.user });
});

module.exports = router;
