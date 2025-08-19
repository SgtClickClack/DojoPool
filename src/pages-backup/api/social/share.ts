import { type NextApiRequest, type NextApiResponse } from 'next';
import { ShareService } from '../../../../dojopool/services/social/share';
import { getCurrentUser } from '../../../../dojopool/services/auth/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get current user
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    switch (req.method) {
      case 'POST':
        return handleCreateShare(req, res, user);
      case 'GET':
        return handleGetShares(req, res, user);
      case 'DELETE':
        return handleDeleteShare(req, res, user);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling share request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreateShare(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) {
  const { content_type, content_id, title, description, metadata } = req.body;

  // Validate required fields
  if (!content_type || !content_id || !title) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate content type
  const validTypes = [
    'game',
    'tournament',
    'achievement',
    'profile',
    'shot',
    'venue',
  ];
  if (!validTypes.includes(content_type)) {
    return res.status(400).json({ error: 'Invalid content type' });
  }

  // Create share
  const [success, error, share] = await ShareService.create_share(
    user.id,
    content_type,
    content_id,
    title,
    description,
    metadata
  );

  if (!success) {
    return res.status(400).json({ error: error || 'Failed to create share' });
  }

  return res.status(201).json(share);
}

async function handleGetShares(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) {
  const { page = '1', per_page = '20', content_types, user_id } = req.query;

  // Parse and validate parameters
  const pageNum = parseInt(page as string);
  const perPageNum = parseInt(per_page as string);
  const types = content_types
    ? (content_types as string).split(',')
    : undefined;
  const targetUserId = user_id ? parseInt(user_id as string) : user.id;

  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({ error: 'Invalid page number' });
  }
  if (isNaN(perPageNum) || perPageNum < 1 || perPageNum > 100) {
    return res.status(400).json({ error: 'Invalid per_page value' });
  }

  // Get shares
  const shares = await ShareService.get_user_shares(
    targetUserId,
    pageNum,
    perPageNum,
    types
  );

  return res.status(200).json(shares);
}

async function handleDeleteShare(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) {
  const { share_id } = req.query;

  // Validate share ID
  if (!share_id || typeof share_id !== 'string') {
    return res.status(400).json({ error: 'Share ID is required' });
  }

  const shareId = parseInt(share_id);
  if (isNaN(shareId)) {
    return res.status(400).json({ error: 'Invalid share ID' });
  }

  // Delete share
  const [success, error] = await ShareService.delete_share(shareId, user.id);

  if (!success) {
    return res.status(400).json({ error: error || 'Failed to delete share' });
  }

  return res.status(204).end();
}
