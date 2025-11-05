const nodemailer = require('nodemailer');
require('dotenv').config();

// ---------------------------
// SENDGRID TRANSPORTER SETUP
// ---------------------------
let transporter;

if (process.env.EMAIL_PROVIDER === 'sendgrid') {
    const sgTransport = require('nodemailer-sendgrid');
    transporter = nodemailer.createTransport(
        sgTransport({
            apiKey: process.env.SENDGRID_API_KEY,
        })
    );
    console.log('✅ Using SendGrid email transporter');
} else {
    // fallback: normal SMTP (for local dev)
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 465,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });
    console.log('📧 Using SMTP transporter (fallback)');
}

// ---------------------------
// SEND EMAIL FUNCTION
// ---------------------------
const sendEmail = async ({ to, subject, text, html }) => {
    try {
        if (!transporter) {
            console.warn('No transporter configured. Email not sent.');
            return { success: false, message: 'Email service not configured' };
        }

        const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER;

        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'News App'}" <${fromAddress}>`,
            to,
            subject,
            text,
            html: html || text.replace(/\n/g, '<br>'),
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent');
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};

// ---------------------------
// NOTIFY SUBSCRIBERS FUNCTION
// ---------------------------
const notifySubscribers = async (news, subscribers = []) => {
    try {
        if (subscribers.length === 0) return { notified: 0 };

        console.log(`🔔 Notifying ${subscribers.length} subscribers about new article in topic: ${news.topic}`);

        const results = await Promise.allSettled(
            subscribers.map(user =>
                sendEmail({
                    to: user.email,
                    subject: `New Article: ${news.title}`,
                    text: `Hi ${user.name || 'Subscriber'},\n\nA new article has been published in ${news.topic}:\n\n${news.title}\n\n${news.content.substring(0, 200)}...\n\nRead more on our website!\n\nBest regards,\nThe News Team`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2>📰 New Article: ${news.title}</h2>
                            <p>Hi ${user.name || 'Subscriber'},</p>
                            <p>A new article has been published in <strong>${news.topic}</strong>:</p>
                            <h3>${news.title}</h3>
                            <p>${news.content.substring(0, 200)}...</p>
                            <p>
                                <a href="${process.env.FRONTEND_URL}/news/${news._id}" 
                                   style="display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
                                    Read Full Article
                                </a>
                            </p>
                            <p>Best regards,<br>The News Team</p>
                        </div>
                    `,
                })
            )
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.length - successful;

        console.log(`✅ Sent ${successful} notifications, ❌ ${failed} failed`);
        return { notified: successful, failed };
    } catch (error) {
        console.error('Error notifying subscribers:', error);
        throw new Error('Failed to notify subscribers');
    }
};

module.exports = {
    sendEmail,
    notifySubscribers,
    transporter,
};
