const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/forgot-password", userController.requestOTP);
router.post("/verify-otp", userController.verifyOTP);
router.post("/reset-password", userController.resetPassword);

// Protected routes
router.patch("/update-reminders", auth, userController.updateReminders);

module.exports = router;
