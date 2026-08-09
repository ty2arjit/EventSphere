import { Resend } from "resend";
import type { Mailer } from "./Mailer";

/**
 * Production mailer, activated by setting RESEND_API_KEY. Until that's
 * set, server.ts wires ConsoleMailer instead — this class is otherwise
 * a drop-in replacement (same Mailer interface), so switching on a real
 * transport is a one-line env var, no code change.
 *
 * Signup: https://resend.com (free tier: 100 emails/day, 3000/month).
 * RESEND_FROM_EMAIL must be a verified sender/domain in that account —
 * Resend rejects sends from unverified addresses.
 */
export class ResendMailer implements Mailer {
  private readonly client: Resend;

  constructor(
    apiKey: string,
    private readonly fromEmail: string,
  ) {
    this.client = new Resend(apiKey);
  }

  async sendVerificationEmail(to: string, verificationLink: string): Promise<void> {
    await this.send(to, "Verify your EventSphere email", [
      `<p>Welcome to EventSphere! Click below to verify your email address:</p>`,
      `<p><a href="${verificationLink}">${verificationLink}</a></p>`,
      `<p>This link expires in 24 hours.</p>`,
    ]);
  }

  async sendVerificationOtp(to: string, code: string): Promise<void> {
    await this.send(to, "Your EventSphere verification code", [
      `<p>Your verification code is:</p>`,
      `<p style="font-size:28px;font-weight:600;letter-spacing:0.2em">${code}</p>`,
      `<p>This code expires in 24 hours.</p>`,
    ]);
  }

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    await this.send(to, "Reset your EventSphere password", [
      `<p>Click below to reset your password:</p>`,
      `<p><a href="${resetLink}">${resetLink}</a></p>`,
      `<p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
    ]);
  }

  private async send(to: string, subject: string, bodyLines: string[]): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.fromEmail,
      to,
      subject,
      html: bodyLines.join("\n"),
    });
    if (error) {
      throw new Error(`Resend send failed: ${error.message}`);
    }
  }
}
