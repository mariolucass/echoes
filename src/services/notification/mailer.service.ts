import nodemailer from "nodemailer";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

export interface Mailer {
  send(to: string, subject: string, text: string): Promise<void>;
}

export class SmtpMailer implements Mailer {
  private readonly transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER
      ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
      : undefined,
  });

  async send(to: string, subject: string, text: string) {
    await this.transport.sendMail({ from: env.SMTP_FROM, to, subject, text });
  }
}

/** Development fallback when SMTP is not configured: logs the message. */
export class ConsoleMailer implements Mailer {
  async send(to: string, subject: string, text: string) {
    logger.warn({ to, subject, text }, "SMTP not configured; email not sent");
  }
}

export function createMailer(): Mailer {
  return env.SMTP_HOST ? new SmtpMailer() : new ConsoleMailer();
}
