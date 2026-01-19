const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        uppercase: true
    },
    description: {
        type: String,
        required: true
    },
    user: {
        type: String, // Code, Email, or Name
        required: true
    },
    role: {
        type: String,
        default: 'USER' // USER, ADMIN, SYSTEM
    },
    ip: {
        type: String,
        default: 'Unknown'
    },
    metadata: {
        type: Object, // Flexible field for extra data like Task ID
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true // Indexed for faster sorting/filtering
    }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
