import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_SMTP_PORT) || 465,
  secure: process.env.SEND_EMAIL_SECURE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
export default async function sendEmail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: `"TS Geosystems Bangladesh" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    // console.log("✅ Email sent to", to);
  } catch (error) {
    console.error("❌ Failed to send email:", error);
  }
}
