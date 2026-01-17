const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

const auth = require("../middleware/auth");

// Admin login
router.post("/login", adminController.login);

// Get current admin profile
router.get("/me", auth, adminController.getMe);

// Admin logout
router.post("/logout", (req, res) => {
    res.status(200).json({ message: "Logout successful" });
});

// Get all tasks (requires authentication in production)
router.get("/tasks", adminController.getAllTasks);

// Get statistics
router.get("/statistics", adminController.getStatistics);

module.exports = router;
