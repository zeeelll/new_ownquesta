// Auth routes

const router = require("express").Router();
const passport = require("passport");
const authController = require("../controllers/auth.controller");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOtp);
router.post("/reset-password", authController.resetPassword);
router.get("/check", authController.check);
router.get("/me", authController.me);
router.put("/profile", authController.updateProfile);
router.post("/change-password", authController.changePassword);
router.post("/2fa/setup", authController.setup2fa);
router.post("/2fa/verify", authController.verify2fa);
router.post("/2fa/disable", authController.disable2fa);
router.post("/delete-account", authController.deleteAccount);

// Google
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: true }, (err, user, info) => {
    if (err) {
      console.error("Google OAuth callback error:", err);
      return res.redirect((process.env.FRONTEND_URL || "http://localhost:3000") + "?oauth_error=1");
    }

    if (!user) {
      return res.redirect((process.env.FRONTEND_URL || "http://localhost:3000") + "/login");
    }

    req.logIn(user, async (loginErr) => {
      if (loginErr) {
        console.error("Login after Google OAuth failed:", loginErr);
        return res.redirect((process.env.FRONTEND_URL || "http://localhost:3000") + "?oauth_error=1");
      }

      console.log('Google user firstLogin:', user.firstLogin);
      // Send welcome email on first login
      if (user.firstLogin !== false) {
        console.log('Sending welcome email to Google user:', user.email);
        const { sendWelcomeEmail } = require("../utils/email");
        await sendWelcomeEmail(user.email, user.name);
        user.firstLogin = false;
        await user.save();
      }

      return res.redirect((process.env.FRONTEND_URL || "http://localhost:3000") + (user.role === 'admin' ? "/admin" : "/home"));
    });
  })(req, res, next);
});

module.exports = router;