import { type NextApiRequest, type NextApiResponse } from 'next';
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
    await limiter.check(res, 3, 'CACHE_TOKEN'); // 3 attempts per hour

    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ message: 'Token and password are required' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long',
      });
    }

    if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+/.test(
        password
      )
    ) {
      return res.status(400).json({
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      });
    }

    // Initialize services
    const mail = new Mail();
    const passwordRecoveryService = new PasswordRecoveryService(mail);

    // Reset password
    const success = await passwordRecoveryService.reset_password(
      token,
      password
    );

    if (!success) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({
      message: 'An error occurred while resetting your password.',
    });
  }
}
