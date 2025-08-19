import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const { method } = req;

  if (method === 'DELETE') {
    try {
      // For now, we'll just return success since we're using mock data
      // In a real implementation, you would delete the dojo from your database
      console.log(`Deleting dojo with ID: ${id}`);
      
      // Simulate a small delay to mimic database operation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      res.status(200).json({ message: 'Dojo deleted successfully' });
    } catch (error) {
      console.error('Error deleting dojo:', error);
      res.status(500).json({ error: 'Failed to delete dojo' });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
