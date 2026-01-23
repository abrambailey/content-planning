export interface EmailMessage {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  textTemplate: string;
  htmlTemplate: string;
}

export type EmailProvider = "resend" | "sendgrid" | "ses" | "postmark" | "none";
