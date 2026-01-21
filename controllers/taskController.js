const Task = require("../models/Task");
const multer = require("multer");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary Storage


// Multer Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "tasks",
        allowed_formats: ["jpg", "png", "jpeg", "webp"],
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
                length,
                width,
                height,
                type,
                description,
                latitude,
                longitude,
                sketchHeight,
                sketchLength,
                sketchWidth,
            } = req.body;

            // Process files - Cloudinary returns the URL in `path` or `secure_url`
            const photoPaths = [];
            if (req.files.photos) {
                for (const file of req.files.photos) {
                    // file.path contains the Cloudinary URL
                    photoPaths.push(file.path);
                }
            }

            let sketchPath = null;

            if (req.files.sketch) {
                sketchPath = req.files.sketch[0].path;
            }

            const taskData = {
                technician: {
                    name: technicianName,
                    email: technicianEmail,
                    phone: technicianPhone,
                },
                photos: photoPaths,
                length,
                width,
                height,
                type,
                description,
                location: {
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    address: req.body.address,
                },
                timestamp: new Date(),
            };

            if (sketchPath) {
                taskData.sketch = sketchPath;
            }

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

            // Audit Log
            const { logAction } = require("./auditController");
            logAction({
                action: 'TASK_SUBMIT',
                description: `New task from ${technicianEmail}`,
                user: technicianEmail,
                role: 'USER',
                ip: req.ip,
                metadata: { taskId: newTask._id, type }
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
            const { length, width, height, sketchHeight, sketchLength, sketchWidth } = req.body;

            let sketchPath = null;

            if (req.files.sketch) {
                sketchPath = req.files.sketch[0].path;
            }

            const updateData = {};
            if (length) {
                updateData.length = length;
            }
            if (width) {
                updateData.width = width;
            }
            if (height) {
                updateData.height = height;
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

            // Audit Log
            const { logAction } = require("./auditController");
            logAction({
                action: 'TASK_UPDATE',
                description: `Task updated (ID: ${taskId})`,
                user: updatedTask.technician.email, // Assuming technician email is preserved
                role: 'USER', // Or ADMIN if updated by admin, but usually app updates
                ip: req.ip,
                metadata: { taskId, dimensions: updateData.dimensions }
            });
        } catch (error) {
            console.error("Task update error:", error);
            res.status(500).json({ message: "Failed to update task" });
        }
    });
};
