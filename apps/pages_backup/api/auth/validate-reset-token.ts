import { type NextApiRequest, type NextApiResponse } from 'next';
import { PasswordRecoveryService } from '../../../../dojopool/services/auth/password_recovery';
import { Mail } from 'flask-mail';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Invalid token' });
    }

    // Initialize services
    const mail = new Mail();
    const passwordRecoveryService = new PasswordRecoveryService(mail);

    // Validate token
    const email = passwordRecoveryService.validate_token(token);

    if (!email) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    return res.status(200).json({ message: 'Token is valid' });
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(500).json({
      message: 'An error occurred while validating the token.',
    });
  }
}
