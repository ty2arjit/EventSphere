/**
 * Outbound email contract. Production implementations (SES/SendGrid/
 * Postmark) plug in here; dev uses ConsoleMailer, which logs the message
 * to the server log instead of actually sending anything. TECHNICAL_
 * BACKLOG.md tracks the production integration as a follow-on.
 */
export interface Mailer {
  sendVerificationEmail(to: string, verificationLink: string): Promise<void>;
  sendPasswordResetEmail(to: string, resetLink: string): Promise<void>;
}
