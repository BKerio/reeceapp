const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// Admin login
router.post("/login", adminController.login);

// Get all tasks (requires authentication in production)
router.get("/tasks", adminController.getAllTasks);

// Get statistics
router.get("/statistics", adminController.getStatistics);

module.exports = router;
