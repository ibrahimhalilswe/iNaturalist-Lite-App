import nodemailer from 'nodemailer';
import * as _shared from './shared.js';
const { welcomeEmail, otpEmail, passwordChangedEmail } = _shared;

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_APP_PASSWORD,
    },
  });
}

async function send(to, { subject, html }) {
  const email = process.env.SMTP_EMAIL;
  if (!email || !process.env.SMTP_APP_PASSWORD) return 'SMTP_EMAIL veya SMTP_APP_PASSWORD eksik.';

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `iNaturalist Lite <${email}>`,
      to,
      subject,
      html,
    });
    return null;
  } catch (err) {
    return err.message;
  }
}

export const sendWelcomeEmail = (email, username) => send(email, welcomeEmail(username));
export const sendOtpEmail = (email, username, otp) => send(email, otpEmail(username, otp));
export const sendPasswordChangedEmail = (email, username) => send(email, passwordChangedEmail(username));
