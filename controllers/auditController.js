const AuditLog = require('../models/AuditLog');

// Internal Helper to create logs
exports.logAction = async ({ action, description, user, role = 'USER', ip = 'Unknown', metadata = {} }) => {
    try {
        await AuditLog.create({
            action,
            description,
            user,
            role,
            ip,
            metadata
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
        // Don't throw, so we don't break the main flow if logging fails
    }
};

// API Endpoint to fetch logs
exports.getLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const logs = await AuditLog.find()
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        const total = await AuditLog.countDocuments();

        res.status(200).json({
            logs,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalLogs: total
        });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({ message: "Failed to fetch audit logs" });
    }
};
