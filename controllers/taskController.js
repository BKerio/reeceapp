const Task = require("../models/Task");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

// Ensure uploads directory exists
const uploadDir = "uploads/tasks";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Memory Storage (to process before saving)
const storage = multer.memoryStorage();

const upload = multer({ storage: storage }).fields([
    { name: "photos", maxCount: 10 },
    { name: "sketch", maxCount: 1 }
]);

// Helper to process and save images
const processImage = async (buffer, originalName, type = 'photo') => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `${uniqueSuffix}.webp`;
    const filePath = path.join(uploadDir, filename);

    let pipeline = sharp(buffer);

    // Apply resizing and WebP conversion
    if (type === 'sketch') {
        pipeline = pipeline.resize(1000, null, { withoutEnlargement: true }).webp({ quality: 85 });
    } else {
        pipeline = pipeline.resize(1200, null, { withoutEnlargement: true }).webp({ quality: 80 });
    }

    await pipeline.toFile(filePath);
    return filePath;
};

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

            // Process files using sharp
            const photoPaths = [];
            if (req.files.photos) {
                for (const file of req.files.photos) {
                    const savedPath = await processImage(file.buffer, file.originalname, 'photo');
                    photoPaths.push(savedPath);
                }
            }

            let sketchPath = null;
            if (req.files.sketch) {
                sketchPath = await processImage(req.files.sketch[0].buffer, req.files.sketch[0].originalname, 'sketch');
            }

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

            let sketchPath = null;
            if (req.files.sketch) {
                sketchPath = await processImage(req.files.sketch[0].buffer, req.files.sketch[0].originalname, 'sketch');
            }

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
