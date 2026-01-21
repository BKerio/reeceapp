const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
    {
        technician: {
            name: { type: String, required: true },
            email: { type: String, required: true },
            phone: { type: String, required: true },
        },
        photos: [{ type: String }], // Array of file paths/URLs
        sketch: { type: String }, // Sketch image path
        length: { type: String },
        width: { type: String },
        height: { type: String },
        sketchMeasurements: {
            height: { type: String },
            length: { type: String },
            width: { type: String },
        },
        type: {
            type: String,
            required: true,
            enum: [
                "2D lit",
                "3D lit",
                "Panel",
                "Frost",
                "Pylon",
                "Door Label",
                "Free standing 1 legged",
                "Free standing 2 legged",
                "Signs",
                "Road Directional",
                "Directory Board",
                "Wall Mounted",
                "Other",
            ],
        },
        description: { type: String },
        location: {
            latitude: { type: Number },
            longitude: { type: Number },
            address: { type: String },
        },
        timestamp: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Task", TaskSchema);
