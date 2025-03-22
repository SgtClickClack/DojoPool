import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const resultsDir = path.join(process.cwd(), 'performance-results');
    const historyFile = path.join(resultsDir, 'history.json');
    const summaryFile = path.join(resultsDir, 'summary.json');

    if (!fs.existsSync(historyFile) || !fs.existsSync(summaryFile)) {
      return res.status(404).json({ message: 'Performance data not found' });
    }

    const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));

    // Process and format the data for the dashboard
    const formattedData = {
      metrics: history.slice(-30).map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp).toISOString(),
      })),
      regressions: summary.regressions || [],
      violations: summary.budgets?.violations || [],
      warnings: summary.budgets?.warnings || [],
    };

    return res.status(200).json(formattedData);
  } catch (error) {
    console.error('Error fetching performance history:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 