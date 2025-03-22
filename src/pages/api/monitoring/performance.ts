import { NextApiRequest, NextApiResponse } from 'next';
import { PerformanceMonitoringService } from '../../../../dojopool/services/monitoring/performance';
import { getCurrentUser } from '../../../../dojopool/services/auth/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get current user
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Parse query parameters
    const { type } = req.query;

    // Get metrics based on type
    let metrics;
    switch (type) {
      case 'system':
        metrics = await PerformanceMonitoringService.get_system_metrics();
        break;
      case 'api':
        metrics = await PerformanceMonitoringService.get_api_metrics();
        break;
      case 'database':
        metrics = await PerformanceMonitoringService.get_database_metrics();
        break;
      case 'cache':
        metrics = await PerformanceMonitoringService.get_cache_metrics();
        break;
      default:
        return res.status(400).json({ error: 'Invalid metrics type' });
    }

    return res.status(200).json(metrics);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 