const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
require("dotenv").config();

const seedAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected for seeding...");

        const adminEmail = "kipthedesigner@gmail.com";
        const adminPassword = "creative,1";

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log(`Admin with email ${adminEmail} already exists!`);
            process.exit(0);
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Create admin
        const admin = new Admin({
            email: adminEmail,
            password: hashedPassword,
            name: "Kip The Designer",
        });

        await admin.save();
        console.log("Admin seeded successfully!");
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);

        process.exit(0);
    } catch (error) {
        console.error("Error seeding admin:", error);
        process.exit(1);
    }
};

seedAdmin();
