const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
require("dotenv").config();

const seedAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected for seeding...");

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: "task@gmail.com" });

        if (existingAdmin) {
            console.log("Admin already exists!");
            process.exit(0);
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash("123456", 10);

        // Create admin
        const admin = new Admin({
            email: "task@gmail.com",
            password: hashedPassword,
            name: "Task Admin",
        });

        await admin.save();
        console.log("Admin seeded successfully!");
        console.log("Email: task@gmail.com");
        console.log("Password: 123456");

        process.exit(0);
    } catch (error) {
        console.error("Error seeding admin:", error);
        process.exit(1);
    }
};

seedAdmin();
