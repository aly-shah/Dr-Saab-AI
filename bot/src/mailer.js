// Outbound email over SMTP (nodemailer). Configured by SMTP_HOST / SMTP_PORT /
// SMTP_USER / SMTP_PASS / MAIL_FROM — see config.mail. With SMTP_HOST unset
// email is simply off: mailEnabled() is false and sendMail() throws.

import nodemailer from "nodemailer";
import { config } from "./config.js";

let transport = null;

export function mailEnabled() {
  return config.mail.enabled;
}

function getTransport() {
  if (!transport) {
    const m = config.mail;
    transport = nodemailer.createTransport({
      host: m.host,
      port: m.port,
      secure: m.secure,
      auth: m.user ? { user: m.user, pass: m.pass } : undefined,
      // One slow SMTP server must not stall the 15-minute scheduler tick.
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 60000,
    });
  }
  return transport;
}

// { to, subject, text, html, attachments: [{ filename, content, contentType }] }
export async function sendMail({ to, subject, text, html, attachments = [] }) {
  if (!mailEnabled()) throw new Error("email is not configured (set SMTP_HOST and MAIL_FROM)");
  const info = await getTransport().sendMail({ from: config.mail.from, to, subject, text, html, attachments });
  if (info.rejected?.length) throw new Error(`recipient rejected: ${info.rejected.join(", ")}`);
  return info;
}

// Checks the SMTP login without sending anything.
export async function verifyMail() {
  if (!mailEnabled()) throw new Error("email is not configured (set SMTP_HOST and MAIL_FROM)");
  return getTransport().verify();
}
