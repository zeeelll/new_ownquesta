// Express app setup
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const MongoStore = require("connect-mongo").default;

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const passportConfig = require("./config/passport");

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  })
);

// ✅ Session store in MongoDB
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
      mongoUrl: process.env.MONGODB_URI
    }),
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());
passportConfig;

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

module.exports = app;
