// Auth routes

const router = require("express").Router();
const passport = require("passport");
const authController = require("../controllers/auth.controller");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/check", authController.check);
router.get("/me", authController.me);

// Google
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

<<<<<<< HEAD
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: true }),
  (req, res) => {
    res.redirect(process.env.FRONTEND_URL + "/home");
  }
);
=======
router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: true }, (err, user, info) => {
    if (err) {
      console.error("Google OAuth callback error:", err);
      // Redirect to frontend home with an error flag so the UI can show a message
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
      // On success, send the user to the frontend home (UI will fetch /api/auth/me)
      return res.redirect(process.env.FRONTEND_URL || "http://localhost:3000");
    });
  })(req, res, next);
});
>>>>>>> 65333659a66f0d38b4c218413148ceeb44433019

module.exports = router;