const Admin = require("../models/Admin");
const Task = require("../models/Task");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Admin Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find admin
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: admin._id, email: admin.email, role: "admin" },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            admin: {
                id: admin._id,
                email: admin.email,
                name: admin.name,
            },
        });

        // Audit Log
        const { logAction } = require("./auditController");
        logAction({
            action: 'LOGIN',
            description: `Admin access: ${admin.email}`,
            user: admin.email,
            role: 'ADMIN',
            ip: req.ip
        });
    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
};

// Get all submitted tasks
exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find().sort({ timestamp: -1 });
        res.status(200).json(tasks);
    } catch (error) {
        console.error("Fetch tasks error:", error);
        res.status(500).json({ message: "Failed to fetch tasks" });
    }
};

// Get task statistics
exports.getStatistics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.timestamp.$lte = end;
            }
        }

        const totalTasks = await Task.countDocuments(query);
        const tasksByType = await Task.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 },
                },
            },
        ]);

        const recentTasks = await Task.find(query)
            .sort({ timestamp: -1 })
            .limit(5)
            .select("type technician.name timestamp location.address");

        res.status(200).json({
            totalTasks,
            tasksByType,
            recentTasks,
        });
    } catch (error) {
        console.error("Fetch statistics error:", error);
        res.status(500).json({ message: "Failed to fetch statistics" });
    }
};

// Get all registered technicians (users)
exports.getAllTechnicians = async (req, res) => {
    try {
        const User = require("../models/User");
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        console.error("Fetch technicians error:", error);
        res.status(500).json({ message: "Failed to fetch technicians" });
    }
};
// Get current admin profile
exports.getMe = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id).select("-password");
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        res.status(200).json(admin);
    } catch (error) {
        console.error("Fetch profile error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
