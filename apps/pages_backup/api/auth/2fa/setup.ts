import { type NextApiRequest, type NextApiResponse } from 'next';
import { TwoFactorService } from '../../../../dojopool/services/auth/two_factor';
import { getCurrentUser } from '../../../../dojopool/utils/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Generate secret and QR code
    const secret = TwoFactorService.generate_secret();
    const qrCode = TwoFactorService.generate_qr_code(secret, user.email);

    // Store secret temporarily (you might want to use a secure session store)
    // This is just for demonstration
    req.session.temp_2fa_secret = secret;

    return res.status(200).json({
      qrCode,
      secret,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
