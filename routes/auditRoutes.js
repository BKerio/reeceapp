const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
// potentially add auth middleware here later
const auth = require('../middleware/auth'); // Assuming we want it protected

router.get('/', auth, auditController.getLogs);

module.exports = router;
