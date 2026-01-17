// Auth controller

const bcrypt = require("bcryptjs");
const passport = require("passport");
const User = require("../models/User");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already used" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hash,
      provider: "local"
    });

    res.status(201).json({ message: "Registered successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info?.message || "Login failed" });

    req.logIn(user, (err2) => {
      if (err2) return next(err2);
      return res.json({ message: "Login success", user });
    });
  })(req, res, next);
};

exports.logout = (req, res) => {
  req.logout(() => {
    res.json({ message: "Logged out" });
  });
};

exports.me = (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  res.json({ user: req.user });
};

exports.check = (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) return res.sendStatus(200);
  return res.sendStatus(401);
};
