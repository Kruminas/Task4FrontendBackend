const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const session = require("express-session");
const dotenv = require("dotenv");
const User = require("./models/user");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;


app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(
  session({
    secret: 'your-session-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = new User({ name, email, password });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
});

// Login Route - Handles session
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if user is blocked
    if (user.blocked) {
      return res.status(403).json({ message: "Your account is blocked" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Update lastLogin field
    user.lastLogin = new Date();  // Set last login time
    await user.save();

    req.session.userId = user._id; // Store user ID in session
    res.status(200).json({ message: "Login successful", userId: user._id });
  } catch (error) {
    res.status(500).json({ message: "Server error during login" });
  }
});




const checkSession = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(403).json({ message: "You must be logged in" });
  }
  next();
};

app.get("/api/users", checkSession, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.status(200).json({ message: "Logged out successfully" });
  });
});

app.post('/api/users/delete', async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!userIds || userIds.length === 0) {
      return res.status(400).json({ message: 'No users selected' });
    }

    await User.deleteMany({ _id: { $in: userIds } });
    res.status(200).json({ message: 'Users deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting users' });
  }
});

app.post('/api/block', async (req, res) => {
  const { userIds } = req.body;
  console.log("User IDs to block:", userIds);
  try {
    await User.updateMany({ _id: { $in: userIds } }, { blocked: true });
    res.status(200).json({ message: 'Users blocked successfully' });
  } catch (error) {
    console.error("Error blocking users:", error);
    res.status(500).json({ message: 'Error blocking users' });
  }
});

app.post('/api/unblock', async (req, res) => {
  const { userIds } = req.body;
  try {
    await User.updateMany({ _id: { $in: userIds } }, { blocked: false });
    res.status(200).json({ message: 'Users unblocked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error unblocking users' });
  }
});


app.listen(port, () => {
  console.log("Server is running on port ${port}");
});