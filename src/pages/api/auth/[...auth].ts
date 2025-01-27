import { NextApiRequest, NextApiResponse } from 'next';
import { signUpWithEmail, signInWithEmail, signInWithGoogle, resetPassword, logOut } from '@/firebase/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const authType = req.query.auth as string[];

  try {
    switch (authType[0]) {
      case 'signup':
        if (method === 'POST') {
          const { email, password, displayName } = req.body;
          const result = await signUpWithEmail(email, password, displayName);
          return res.status(result.success ? 200 : 400).json(result);
        }
        break;

      case 'signin':
        if (method === 'POST') {
          const { email, password } = req.body;
          const result = await signInWithEmail(email, password);
          return res.status(result.success ? 200 : 400).json(result);
        }
        break;

      case 'google':
        if (method === 'POST') {
          const result = await signInWithGoogle();
          return res.status(result.success ? 200 : 400).json(result);
        }
        break;

      case 'reset-password':
        if (method === 'POST') {
          const { email } = req.body;
          const result = await resetPassword(email);
          return res.status(result.success ? 200 : 400).json(result);
        }
        break;

      case 'logout':
        if (method === 'POST') {
          const result = await logOut();
          return res.status(result.success ? 200 : 400).json(result);
        }
        break;

      default:
        return res.status(404).json({ success: false, error: 'Route not found' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
} 