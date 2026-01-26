// Passport configuration

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// ✅ Local
passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      // Allow login if provider is "local" or "both"
      const user = await User.findOne({ email, provider: { $in: ["local", "both"] } });
      if (!user) return done(null, false, { message: "User not found" });

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return done(null, false, { message: "Invalid password" });

      user.lastLogin = new Date();
      await user.save();

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// ✅ Google OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn('⚠️ Google OAuth credentials not set. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment.');
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth profile:', profile);
        const googleEmail = profile.emails?.[0]?.value || "";
        console.log('Google email:', googleEmail);
        
        // First, try to find user by googleId
        let user = await User.findOne({ googleId: profile.id });
        console.log('User found by googleId:', user ? user._id : 'none');

        if (!user && googleEmail) {
          // If not found by googleId, check if user exists with same email (local account)
          user = await User.findOne({ email: googleEmail });
          console.log('User found by email:', user ? user._id : 'none');
          
          if (user) {
            // Link Google account to existing local account
            user.googleId = profile.id;
            user.avatar = user.avatar || profile.photos?.[0]?.value || "";
            user.provider = "both"; // User can now login with both methods
            await user.save();
            console.log("✅ Linked Google account to existing user:", user._id);
          }
        }

        if (!user) {
          console.log('Creating new Google user');
          // Create new user if doesn't exist
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: googleEmail,
            avatar: profile.photos?.[0]?.value || "",
            provider: "google",
            phone: "",
            bio: "",
            company: "",
            jobTitle: "",
            location: "",
            skills: "",
            settings: {
              emailNotif: true,
              darkMode: true,
              twoFactorAuth: false
            },
            twoFactorSecret: null,
            firstLogin: true
          });
          console.log("✅ New Google user created:", user._id);
        }

        return done(null, user);
      } catch (err) {
        console.error('Google OAuth verify error:', err);
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;