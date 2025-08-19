import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';

interface EmailData {
  to: string;
  subject: string;
  body: string;
}

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: functions.config().email.host,
  port: functions.config().email.port,
  secure: functions.config().email.secure,
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.pass,
  },
});

export const sendEmail = functions.https.onCall(
  async (request: functions.https.CallableRequest<EmailData>) => {
    // Check if the user is authenticated
    if (!request.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    try {
      // Send email
      await transporter.sendMail({
        from: functions.config().email.from,
        to: request.data.to,
        subject: request.data.subject,
        text: request.data.body,
        html: request.data.body.replace(/\n/g, '<br>'),
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error sending email:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to send email',
        error.message
      );
    }
  }
);
