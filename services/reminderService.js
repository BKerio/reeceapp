const cron = require('node-cron');
const User = require('../models/User');
const { sendSMS } = require('./otpService');

/**
 * Technical Reminder Cron Job
 * Runs every day from Monday to Friday exactly at 5:00 PM (17:00) EAT
 * EAT is UTC+3. Cron normally uses server time. 
 * We use 'Africa/Nairobi' to ensure it's exactly 5 PM EAT.
 */
const initReminders = () => {
    // Cron expression: 0 17 * * 1-5 (Seconds Minutes Hour DayOfMonth Month DayOfWeek)
    // node-cron uses: minute hour dayOfMonth month dayOfWeek
    cron.schedule('25 16 * * 1-5', async () => {
        console.log('--- Triggering Daily Task Submission Reminders (5 PM EAT Monday-Friday) ---');

        try {
            // 1. Fetch only users who have reminders enabled
            const users = await User.find({ remindersEnabled: { $ne: false } });

            if (!users || users.length === 0) {
                console.log('No users found to send reminders.');
                return;
            }

            console.log(`Processing reminders for ${users.length} users...`);

            // 2. Iterate and send SMS
            for (const user of users) {
                if (user.phone) {
                    const message = `Hi ${user.name}, this is a reminder to submit your task reports, images and task sketches for today via the Elegance Designer & Printer app before closing. Thank you!`;

                    try {
                        await sendSMS(user.phone, message);
                        console.log(`Reminder sent successfully to ${user.name} (${user.phone})`);
                    } catch (error) {
                        console.error(`Failed to send reminder to ${user.name}:`, error.message);
                    }
                }
            }

            console.log('--- Daily Reminder Job Completed ---');
        } catch (error) {
            console.error('Error in reminder cron job:', error);
        }
    }, {
        scheduled: true,
        timezone: "Africa/Nairobi"
    });

    console.log('Reminder Service Initialized: Scheduled for 5:00 PM EAT, Mon-Fri.');
};

module.exports = { initReminders };
