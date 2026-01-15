// Auth routes

const router = require("express").Router();
const passport = require("passport");
const authController = require("../controllers/auth.controller");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", authController.me);

// Google
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: true }),
  (req, res) => {
    res.redirect(process.env.FRONTEND_URL + "/dashboard");
  }
);

module.exports = router;
