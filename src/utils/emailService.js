// utils/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

// ---------------------------
// PRIORITY 1: Gmail (App Password Auth)
// ---------------------------
// try {
//     if (process.env.SMTP_USER && process.env.SMTP_USER.endsWith('@gmail.com')) {
//         transporter = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 user: process.env.SMTP_USER,
//                 pass: process.env.SMTP_PASSWORD, // Gmail App Password
//             },
//         });
//         console.log('Using Gmail transporter (primary)');
//     }
// } catch (err) {
//     console.warn('Gmail transporter failed to initialize:', err.message);
// }

// ---------------------------
// PRIORITY 2: SendGrid fallback
// ---------------------------
if (!transporter && process.env.SENDGRID_API_KEY) {
    try {
        const sgTransport = require('nodemailer-sendgrid');
        transporter = nodemailer.createTransport(
            sgTransport({
                apiKey: process.env.SENDGRID_API_KEY,
            })
        );
        console.log('Using SendGrid transporter (fallback)');
    } catch (err) {
        console.warn('SendGrid transporter failed to initialize:', err.message);
    }
}

// ---------------------------
// PRIORITY 3: Generic SMTP fallback
// ---------------------------
if (!transporter) {
    try {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
        console.log('Using generic SMTP transporter (fallback)');
    } catch (err) {
        console.warn('Generic SMTP transporter failed:', err.message);
    }
}

// ---------------------------
// SEND EMAIL FUNCTION
// ---------------------------
const sendEmail = async ({ to, subject, text, html }) => {
    if (!transporter) {
        console.error('No email transporter configured.');
        return { success: false, message: 'Email service unavailable' };
    }

    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER;
    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'News App'}" <${fromAddress}>`,
        to,
        subject,
        text,
        html: html || text.replace(/\n/g, '<br>'),
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error.message);
        return { success: false, error: error.message };
    }
};

// ---------------------------
// NOTIFY SUBSCRIBERS FUNCTION
// ---------------------------
const notifySubscribers = async (news, subscribers = []) => {
    if (subscribers.length === 0) return { notified: 0 };

    console.log(`Notifying ${subscribers.length} subscribers for topic: ${news.topic}`);

    const results = await Promise.allSettled(
        subscribers.map((user) =>
            sendEmail({
                to: user.email,
                subject: `New Article: ${news.title}`,
                text: `Hi ${user.name || 'Subscriber'},\n\nA new article has been published in ${news.topic}.\n\n${news.title}\n\n${news.content.substring(0, 200)}...\n\nRead more: ${process.env.FRONTEND_URL}/news/${news._id}\n\nBest,\nThe News Team`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>📰 New Article: ${news.title}</h2>
                        <p>Hi ${user.name || 'Subscriber'},</p>
                        <p>New article published in <strong>${news.topic}</strong>:</p>
                        <h3>${news.title}</h3>
                        <p>${news.content.substring(0, 200)}...</p>
                        <p><a href="${process.env.FRONTEND_URL}/news/${news._id}"
                            style="display:inline-block;padding:10px 20px;background:#4CAF50;color:white;text-decoration:none;border-radius:4px;">
                            Read Full Article
                        </a></p>
                        <p>Best regards,<br>The News Team</p>
                    </div>
                `,
            })
        )
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - successful;

    console.log(`Sent ${successful} notifications, ${failed} failed`);
    return { notified: successful, failed };
};

module.exports = { sendEmail, notifySubscribers };
