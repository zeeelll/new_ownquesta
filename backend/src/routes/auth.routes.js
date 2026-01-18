// Auth routes

const router = require("express").Router();
const passport = require("passport");
const authController = require("../controllers/auth.controller");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
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

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error("Login after Google OAuth failed:", loginErr);
        return res.redirect((process.env.FRONTEND_URL || "http://localhost:3000") + "?oauth_error=1");
      }
      return res.redirect(process.env.FRONTEND_URL || "http://localhost:3000");
    });
  })(req, res, next);
});

module.exports = router;