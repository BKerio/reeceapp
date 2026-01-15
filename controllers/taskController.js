const Task = require("../models/Task");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = "uploads/tasks";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage }).fields([
    { name: "photos", maxCount: 10 },
    { name: "sketch", maxCount: 1 }
]);

exports.submitTask = (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            console.error("Multer error:", err);
            return res.status(500).json({ message: "File upload error" });
        } else if (err) {
            console.error("Unknown upload error:", err);
            return res.status(500).json({ message: "Server error during upload" });
        }

        try {
            const {
                technicianName,
                technicianEmail,
                technicianPhone,
                specifications,
                dimensions,
                type,
                description,
                latitude,
                longitude,
                sketchHeight,
                sketchLength,
                sketchWidth,
            } = req.body;

            // Extract file paths
            const photoPaths = req.files.photos ? req.files.photos.map((file) => file.path) : [];
            const sketchPath = req.files.sketch ? req.files.sketch[0].path : null;

            const taskData = {
                technician: {
                    name: technicianName,
                    email: technicianEmail,
                    phone: technicianPhone,
                },
                photos: photoPaths,
                specifications,
                dimensions,
                type,
                description,
                location: {
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    address: req.body.address,
                },
                timestamp: new Date(),
            };

            // Add sketch data if provided
            if (sketchPath) {
                taskData.sketch = sketchPath;
            }

            // Add sketch measurements if provided
            if (sketchHeight || sketchLength || sketchWidth) {
                taskData.sketchMeasurements = {
                    height: sketchHeight || "",
                    length: sketchLength || "",
                    width: sketchWidth || "",
                };
            }

            const newTask = new Task(taskData);
            await newTask.save();

            res.status(201).json({
                message: "Task submitted successfully",
                task: newTask,
            });
        } catch (error) {
            console.error("Task submission error:", error);
            res.status(500).json({ message: "Failed to submit task" });
        }
    });
};

exports.getTaskHistory = async (req, res) => {
    try {
        const { email } = req.params;
        const tasks = await Task.find({ "technician.email": email }).sort({
            timestamp: -1,
        });
        res.status(200).json(tasks);
    } catch (error) {
        console.error("Fetch history error:", error);
        res.status(500).json({ message: "Failed to fetch task history" });
    }
};

exports.updateTask = (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            console.error("Multer error:", err);
            return res.status(500).json({ message: "File upload error" });
        } else if (err) {
            console.error("Unknown upload error:", err);
            return res.status(500).json({ message: "Server error during upload" });
        }

        try {
            const taskId = req.params.id;
            const { dimensions, sketchHeight, sketchLength, sketchWidth } = req.body;
            const sketchPath = req.files.sketch ? req.files.sketch[0].path : null;

            const updateData = {};
            if (dimensions) {
                updateData.dimensions = dimensions;
            }

            if (sketchPath) {
                updateData.sketch = sketchPath;
            }

            if (sketchHeight || sketchLength || sketchWidth) {
                updateData.sketchMeasurements = {
                    height: sketchHeight || "",
                    length: sketchLength || "",
                    width: sketchWidth || "",
                };
            }

            const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, { new: true });

            if (!updatedTask) {
                return res.status(404).json({ message: "Task not found" });
            }

            res.status(200).json({
                message: "Task updated successfully",
                task: updatedTask,
            });
        } catch (error) {
            console.error("Task update error:", error);
            res.status(500).json({ message: "Failed to update task" });
        }
    });
};
