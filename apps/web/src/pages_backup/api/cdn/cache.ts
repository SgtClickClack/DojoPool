import { type NextApiRequest, type NextApiResponse } from 'next';
import { CDNCacheOptimizer } from '../../../../dojopool/services/cdn/cache_optimizer';
import { getCurrentUser } from '../../../../dojopool/services/auth/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cacheOptimizer = new CDNCacheOptimizer();
    const report = cacheOptimizer.generate_optimization_report();

    return res.status(200).json(report);
  } catch (error) {
    console.error('Error in CDN cache optimization:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
