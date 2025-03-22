import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './config';

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
}

const functions = getFunctions(app);

export const sendEmail = async (options: EmailOptions): Promise<{ success: boolean; error?: string }> => {
  try {
    const sendEmailFunction = httpsCallable(functions, 'sendEmail');
    await sendEmailFunction({
      to: options.to,
      subject: options.subject,
      body: options.body
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}; 