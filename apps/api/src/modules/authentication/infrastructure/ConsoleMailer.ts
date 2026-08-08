import type { Logger } from 'pino';
import { Mailer } from './Mailer';

/**
 * Dev-mode mailer. Logs the message the user would have received to the
 * server log. Never used in production — production wires a real
 * transport (Postmark/SES/etc.). Deliberately writes at info level so
 * links are trivially visible during local development.
 */
export class ConsoleMailer implements Mailer {
  constructor(private readonly logger: Logger) {}

  async sendVerificationEmail(to: string, verificationLink: string): Promise<void> {
    this.logger.info({ to, verificationLink }, '[DEV MAILER] Verify your email');
  }

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    this.logger.info({ to, resetLink }, '[DEV MAILER] Reset your password');
  }
}
