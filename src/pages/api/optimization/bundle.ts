import { NextApiRequest, NextApiResponse } from 'next';
import { BundleOptimizationService } from '../../../../dojopool/services/optimization/bundle';
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
      // Get bundle analysis
      const analysis = await BundleOptimizationService.get_bundle_analysis();
      return res.status(200).json(analysis);
    } else {
      // Process optimization request
      const { action, data } = req.body;

      if (!action) {
        return res.status(400).json({ error: 'Action is required' });
      }

      let result;
      switch (action) {
        case 'analyze_bundle':
          if (!data?.bundle_path) {
            return res.status(400).json({ error: 'Bundle path is required' });
          }
          result = await BundleOptimizationService.analyze_bundle_size(data.bundle_path);
          break;
        case 'optimize_chunks':
          if (!data?.chunks) {
            return res.status(400).json({ error: 'Chunks data is required' });
          }
          result = await BundleOptimizationService.optimize_chunks(data.chunks);
          break;
        case 'get_large_chunks':
          const threshold = data?.threshold || 100 * 1024;
          result = await BundleOptimizationService.get_large_chunks(threshold);
          break;
        case 'generate_report':
          result = await BundleOptimizationService.generate_optimization_report();
          break;
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }

      return res.status(200).json(result);
    }
  } catch (error) {
    console.error('Error processing bundle optimization:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 