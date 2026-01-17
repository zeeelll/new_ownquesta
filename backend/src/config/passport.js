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
      const user = await User.findOne({ email, provider: "local" });
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
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0]?.value || "",
            avatar: profile.photos?.[0]?.value || "",
            provider: "google",
            phone: "",
            dateOfBirth: "",
            bio: "",
            company: "",
            jobTitle: "",
            location: "",
            department: "",
            website: "",
            emailNotif: true,
            marketingEmails: false,
            publicProfile: true,
            twoFactorAuth: false,
            language: "en",
            timezone: "UTC",
            isActive: true,
            role: "user",
            subscription: "free",
            settings: {
              emailNotif: true,
              marketingEmails: false,
              publicProfile: true,
              twoFactorAuth: false,
              language: "en",
              timezone: "UTC"
            }
          });
          console.log("✅ New Google user created:", user._id);
        }

        user.lastLogin = new Date();
        await user.save();

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