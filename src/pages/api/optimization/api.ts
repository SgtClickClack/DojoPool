import { NextApiRequest, NextApiResponse } from 'next';
import { APIOptimizationService } from '../../../../dojopool/services/optimization/api';
import { getCurrentUser } from '../../../../dojopool/services/auth/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get current user
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get API analysis
      const analysis = await APIOptimizationService.get_api_analysis();
      return res.status(200).json(analysis);
    } else {
      // Process optimization request
      const { action, data } = req.body;

      if (!action) {
        return res.status(400).json({ error: 'Action is required' });
      }

      let result;
      switch (action) {
        case 'optimize_payload':
          if (!data) {
            return res.status(400).json({ error: 'Data is required for payload optimization' });
          }
          result = await APIOptimizationService.optimize_payload(data);
          break;
        case 'get_slow_endpoints':
          const threshold = req.body.threshold || 100;
          result = await APIOptimizationService.get_slow_endpoints(threshold);
          break;
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }

      return res.status(200).json(result);
    }
  } catch (error) {
    console.error('Error processing API optimization:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 