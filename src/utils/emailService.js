const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com', // Replace with your SMTP host
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER, // Your email
        pass: process.env.SMTP_PASSWORD, // Your email password or app-specific password
    },
});

// Function to send email
const sendEmail = async ({ to, subject, text, html }) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
            console.warn('SMTP credentials not configured. Email not sent.');
            return { success: false, message: 'Email service not configured' };
        }

        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'News App'}" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
            html: html || text.replace(/\n/g, '<br>'), // Convert newlines to <br> if HTML is not provided
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};

// Function to notify subscribers about new news article
const notifySubscribers = async (news, topicSubscribers = []) => {
    try {
        // Get all users who are subscribed to the newsletter
        const users = await User.find({
            'preferences.subscribeToNewsletter': true,
            'preferences.emailNotifications': true,
            ...(topicSubscribers.length > 0 && { 'preferences.topics': { $in: [news.topic] } })
        });

        if (users.length === 0) return { notified: 0 };

        const results = await Promise.allSettled(
            users.map(user => 
                sendEmail({
                    to: user.email,
                    subject: `New Article: ${news.title}`,
                    text: `Hi ${user.name},\n\nA new article has been published in ${news.topic}:\n\n${news.title}\n\n${news.content.substring(0, 200)}...\n\nRead more on our website!\n\nBest regards,\nThe News Team`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2>New Article: ${news.title}</h2>
                            <p>Hi ${user.name},</p>
                            <p>A new article has been published in <strong>${news.topic}</strong>:</p>
                            <h3>${news.title}</h3>
                            <p>${news.content.substring(0, 200)}...</p>
                            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/news/${news._id}" 
                                  style="display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
                                Read Full Article
                            </a></p>
                            <p>Best regards,<br>The News Team</p>
                        </div>
                    `
                })
            )
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.length - successful;
        
        console.log(`Sent ${successful} notifications, ${failed} failed`);
        return { notified: successful, failed };
    } catch (error) {
        console.error('Error notifying subscribers:', error);
        throw new Error('Failed to notify subscribers');
    }
};

module.exports = {
    sendEmail,
    notifySubscribers,
    transporter
};

// This file handles all email-related functionality for the application, including sending individual emails and notifying subscribers about new articles.
