import type { EmailMessage, EmailResult } from "./types";

/**
 * Send an email using the configured email service provider.
 *
 * TODO: Integrate with an email service provider (ESP):
 * - Resend (recommended): https://resend.com
 * - SendGrid: https://sendgrid.com
 * - Amazon SES: https://aws.amazon.com/ses
 * - Postmark: https://postmarkapp.com
 *
 * Environment variables to add when integrating:
 * - EMAIL_PROVIDER: "resend" | "sendgrid" | "ses" | "postmark"
 * - EMAIL_API_KEY: Your ESP API key
 * - EMAIL_FROM: Default from address (e.g., "notifications@yourdomain.com")
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  // Log in development instead of sending
  if (process.env.NODE_ENV === "development") {
    console.log("[Email] Would send email:", {
      to: message.to,
      subject: message.subject,
      textPreview: message.text?.substring(0, 100),
    });
    return {
      success: true,
      messageId: `dev-${Date.now()}`,
    };
  }

  // TODO: Implement actual email sending
  // Example with Resend:
  //
  // import { Resend } from "resend";
  // const resend = new Resend(process.env.RESEND_API_KEY);
  //
  // try {
  //   const { data, error } = await resend.emails.send({
  //     from: message.from || process.env.EMAIL_FROM || "onboarding@resend.dev",
  //     to: message.to,
  //     subject: message.subject,
  //     text: message.text,
  //     html: message.html,
  //   });
  //
  //   if (error) {
  //     return { success: false, error: error.message };
  //   }
  //
  //   return { success: true, messageId: data?.id };
  // } catch (err) {
  //   return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  // }

  console.warn(
    "[Email] Email sending not configured. Message would be sent to:",
    message.to
  );

  return {
    success: false,
    error: "Email provider not configured",
  };
}

/**
 * Send a notification email to a user.
 */
export async function sendNotificationEmail(
  to: string,
  title: string,
  body: string,
  actionUrl?: string
): Promise<EmailResult> {
  const text = actionUrl
    ? `${title}\n\n${body}\n\nView: ${actionUrl}`
    : `${title}\n\n${body}`;

  const html = actionUrl
    ? `
      <h2>${title}</h2>
      <p>${body}</p>
      <p><a href="${actionUrl}">View in app</a></p>
    `
    : `
      <h2>${title}</h2>
      <p>${body}</p>
    `;

  return sendEmail({
    to,
    subject: title,
    text,
    html,
  });
}
