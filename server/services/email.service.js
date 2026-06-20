import nodemailer from "nodemailer";
import { getEnv } from "../config/env.js";

let transporter = null;

function getTransporter() {
  const env = getEnv();
  if (!env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: false,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  const env = getEnv();
  const transport = getTransporter();
  if (!transport) {
    console.log(`[email:dev] To: ${to} | ${subject}\n${text || html}`);
    return { dev: true };
  }
  return transport.sendMail({
    from: env.SMTP_FROM || "Findora <noreply@findora.app>",
    to,
    subject,
    html,
    text,
  });
}
