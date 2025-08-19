// Temporarily disabled due to Firebase import issues
// import { getFunctions, httpsCallable } from 'firebase/functions';
// import { app } from './config';

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
}

// const functions = getFunctions(app);

export const sendEmail = async (
  options: EmailOptions
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Email sending temporarily disabled', options);
    return { success: false, error: 'Email sending temporarily disabled' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
