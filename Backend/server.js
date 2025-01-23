// server.js

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const session = require("express-session");
const dotenv = require("dotenv");
const path = require("path");
const MongoStore = require("connect-mongo");

// Load environment variables (e.g. MONGO_URI)
dotenv.config();

// Import User model
const User = require("./models/user");

// Initialize Express
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - for local dev, only allow http://localhost:3000.
// If deploying with a React build in the same server, you may switch to a different origin or remove.
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Session setup
app.use(
  session({
    secret: "your-session-secret",
    resave: false,
    saveUninitialized: false, // generally better to set this to false
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: { secure: false }, // for HTTPS in production, you'd set secure: true
  })
);

// ======= CONNECT TO MONGO =======
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ================================
//           API ROUTES
// ================================

// Register
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = new User({ name, email, password });
    await user.save();
    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error registering user", error });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (user.blocked) {
      return res.status(403).json({ message: "Your account is blocked" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    // Update lastLogin
    user.lastLogin = new Date();
    await user.save();

    req.session.userId = user._id; // store user ID in session
    return res.status(200).json({ message: "Login successful", userId: user._id });
  } catch (error) {
    return res.status(500).json({ message: "Server error during login" });
  }
});

// Middleware to check session for protected routes
const checkSession = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(403).json({ message: "You must be logged in" });
  }
  next();
};

// Get all users (requires login)
app.get("/api/users", checkSession, async (req, res) => {
  try {
    const users = await User.find();
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Logout
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.status(200).json({ message: "Logged out successfully" });
  });
});

// Delete users
app.post("/api/users/delete", async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!userIds || userIds.length === 0) {
      return res.status(400).json({ message: "No users selected" });
    }
    await User.deleteMany({ _id: { $in: userIds } });
    return res.status(200).json({ message: "Users deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting users" });
  }
});

// Block users
app.post("/api/block", async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!userIds || userIds.length === 0) {
      return res.status(400).json({ message: "No users selected" });
    }
    await User.updateMany({ _id: { $in: userIds } }, { blocked: true });
    return res.status(200).json({ message: "Users blocked successfully" });
  } catch (error) {
    console.error("Error blocking users:", error);
    return res.status(500).json({ message: "Error blocking users" });
  }
});

// Unblock users
app.post("/api/unblock", async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!userIds || userIds.length === 0) {
      return res.status(400).json({ message: "No users selected" });
    }
    await User.updateMany({ _id: { $in: userIds } }, { blocked: false });
    return res.status(200).json({ message: "Users unblocked successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error unblocking users" });
  }
});

// ================================
//         SERVE REACT BUILD
// ================================

// 1) Serve static files from the React build folder
app.use(express.static(path.join(__dirname, "build")));

// 2) Catch-all route: send back React's index.html for any non-API route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// ================================
//       START THE SERVER
// ================================
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});