const axios = require("axios");
const nodemailer = require("nodemailer");

// Helper to clean env variables from quotes, commas, and semicolons
const cleanEnv = (val) => {
    if (!val) return "";
    return val.toString().replace(/["',;]/g, "").trim();
};

exports.sendSMS = async (phone, message) => {
    try {
        const apiKey = cleanEnv(process.env.ADVANTA_SMS_APIKEY);
        const partnerId = cleanEnv(process.env.ADVANTA_SMS_PARTNER_ID);
        const shortcode = cleanEnv(process.env.ADVANTA_SMS_SHORTCODE);
        const url = cleanEnv(process.env.ADVANTA_SMS_URL);

        const data = {
            apikey: apiKey,
            partnerID: parseInt(partnerId) || partnerId, // Try to send as number
            message: message,
            shortcode: shortcode,
            mobile: phone,
        };



        const response = await axios.post(url, data);



        if (response.data['response-code'] !== 200) {
            console.error("SMS API Error Details:", response.data.errors);
        }

        return response.data;
    } catch (error) {
        console.error("SMS error:", error.response ? error.response.data : error.message);
        throw new Error("Failed to send SMS");
    }
};

exports.sendEmail = async (email, subject, text) => {
    try {
        const host = cleanEnv(process.env.MAIL_HOST);
        const port = cleanEnv(process.env.MAIL_PORT);
        const user = cleanEnv(process.env.MAIL_USERNAME);
        const pass = cleanEnv(process.env.MAIL_PASSWORD);
        const fromName = cleanEnv(process.env.MAIL_FROM_NAME);
        const fromAddr = cleanEnv(process.env.MAIL_FROM_ADDRESS);

        const transporter = nodemailer.createTransport({
            host: host,
            port: parseInt(port),
            secure: parseInt(port) === 465,
            auth: {
                user: user,
                pass: pass,
            },
        });

        const mailOptions = {
            from: `"${fromName}" <${fromAddr}>`,
            to: email,
            subject: subject,
            text: text,
        };

        const info = await transporter.sendMail(mailOptions);
        // console.log("Email sent successfully:", info.messageId);
        return { success: true, message: "Email sent", messageId: info.messageId };
    } catch (error) {
        console.error("Email error details:", error);
        throw new Error("Failed to send email");
    }
};
