// Express app setup
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const _connectMongo = require("connect-mongo");
const MongoStore = _connectMongo && typeof _connectMongo.create === "function"
  ? _connectMongo
  : _connectMongo && _connectMongo.default && typeof _connectMongo.default.create === "function"
  ? _connectMongo.default
  : _connectMongo;

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes");
require("./config/passport");

const app = express();

app.use(express.json());

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  })
);

// ✅ Session store in MongoDB
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_session_secret",
    resave: false,
    saveUninitialized: false,
    store: (typeof MongoStore.create === "function")
      ? MongoStore.create({ 
          mongoUrl: process.env.MONGODB_URI,
          touchAfter: 24 * 3600
        })
      : new MongoStore({ 
          mongoUrl: process.env.MONGODB_URI,
          touchAfter: 24 * 3600
        }),
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

module.exports = app;
