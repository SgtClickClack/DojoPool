import { NextApiRequest, NextApiResponse } from 'next';
import { PasswordRecoveryService } from '../../../../dojopool/services/auth/password_recovery';
import { Mail } from 'flask-mail';
import { rateLimit } from '../../../../middleware/rateLimit';

const limiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Apply rate limiting
    await limiter.check(res, 3, 'CACHE_TOKEN'); // 3 requests per hour

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Initialize services
    const mail = new Mail();
    const passwordRecoveryService = new PasswordRecoveryService(mail);

    // Generate recovery token
    const token = passwordRecoveryService.generate_recovery_token(email);

    // Send recovery email
    await passwordRecoveryService.send_recovery_email(email, token);

    // Always return success to prevent email enumeration
    return res.status(200).json({
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({
      message: 'An error occurred while processing your request.',
    });
  }
} 