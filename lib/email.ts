import nodemailer from 'nodemailer';

// Create transporter using existing environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Send signup confirmation email
export async function sendSignupConfirmation(
  participantEmail: string,
  participantName: string,
  eventTitle: string,
  eventDate: string | null,
  eventLocation: string | null
) {
  const transporter = createTransporter();
  
  const eventDateStr = eventDate ? new Date(eventDate).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'TBD';

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: participantEmail,
    bcc: process.env.SMTP_USER, // BCC to admin
    subject: `Registration Confirmed - ${eventTitle}`,
    text: `
      Dear ${participantName},

      Thank you for registering for ${eventTitle}!

      Event Details:
      - Event: ${eventTitle}
      - Date: ${eventDateStr}
      - Location: ${eventLocation || 'TBD'}

      We look forward to seeing you there!

      Best regards,
      JAX Team
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Registration Confirmed!</h2>
        <p>Dear ${participantName},</p>
        <p>Thank you for registering for <strong>${eventTitle}</strong>!</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #4F46E5; margin-top: 0;">Event Details:</h3>
          <p><strong>Event:</strong> ${eventTitle}</p>
          <p><strong>Date:</strong> ${eventDateStr}</p>
          <p><strong>Location:</strong> ${eventLocation || 'TBD'}</p>
        </div>

        <p>We look forward to seeing you there!</p>
        <p>Best regards,<br>JAX Team</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

// Send admin bulk email to all participants
export async function sendBulkEmail(
  participantEmails: string[],
  subject: string,
  message: string,
  eventTitle: string
) {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.SMTP_USER, // Send to admin first
    bcc: participantEmails, // BCC to all participants
    subject: `[${eventTitle}] ${subject}`,
    text: `
      ${message}

      ---
      This message was sent to all registered participants of ${eventTitle}.
      If you have any questions, please contact us.

      Best regards,
      JAX Team
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">
          This message was sent to all registered participants of <strong>${eventTitle}</strong>.<br>
          If you have any questions, please contact us.
        </p>
        
        <p>Best regards,<br>JAX Team</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
} 