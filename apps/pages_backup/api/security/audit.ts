import { type NextApiRequest, type NextApiResponse } from 'next';
import { SecurityAuditService } from '../../../../dojopool/services/security/audit';
import { getCurrentUser } from '../../../../dojopool/utils/auth';
import { requireSession } from '../../../../middleware/session';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Generate security report
    const report = SecurityAuditService.generate_security_report(user.id);
    const results = JSON.parse(report);

    return res.status(200).json(results);
  } catch (error) {
    console.error('Security audit error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default requireSession(handler);
