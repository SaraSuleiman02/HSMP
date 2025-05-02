import nodemailer from 'nodemailer';

// helper: Configure Nodemailer transporter
export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});