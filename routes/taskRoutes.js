const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");

router.post("/submit", taskController.submitTask);
router.get("/history/:email", taskController.getTaskHistory);
router.put("/update/:id", taskController.updateTask);

module.exports = router;
