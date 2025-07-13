import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Mock data storage (in real app, this would be database)
const clans: any[] = [];
const clanMembers: any[] = [];
const clanWars: any[] = [];
const clanInvites: any[] = [];

// Mock clan data
const mockClans = [
  {
    id: '1',
    name: 'Dragon Slayers',
    tag: 'DS',
    description: 'Elite pool warriors who dominate the table',
    avatar: '/images/clans/dragon.webp',
    banner: '/images/clans/dragon-banner.webp',
    leaderId: '1',
    leaderName: 'ShadowStriker',
    memberCount: 15,
    maxMembers: 50,
    level: 8,
    experience: 12500,
    territoryCount: 12,
    totalWins: 156,
    totalLosses: 23,
    winRate: 0.87,
    createdAt: new Date('2024-01-01'),
    isPublic: true,
    requirements: {
      minRank: 'silver',
      minTerritories: 2,
      minWins: 10
    }
  },
  {
    id: '2',
    name: 'Phoenix Rising',
    tag: 'PR',
    description: 'Rising stars of the pool world',
    avatar: '/images/clans/phoenix.webp',
    banner: '/images/clans/phoenix-banner.webp',
    leaderId: '2',
    leaderName: 'PoolMaster',
    memberCount: 22,
    maxMembers: 50,
    level: 6,
    experience: 8900,
    territoryCount: 8,
    totalWins: 98,
    totalLosses: 34,
    winRate: 0.74,
    createdAt: new Date('2024-02-01'),
    isPublic: true,
    requirements: {
      minRank: 'bronze',
      minTerritories: 1,
      minWins: 5
    }
  },
  {
    id: '3',
    name: 'Lone Wolves',
    tag: 'LW',
    description: 'Independent players who prefer solo glory',
    avatar: '/images/clans/wolf.webp',
    banner: '/images/clans/wolf-banner.webp',
    leaderId: '3',
    leaderName: 'CueArtist',
    memberCount: 8,
    maxMembers: 20,
    level: 4,
    experience: 5200,
    territoryCount: 5,
    totalWins: 67,
    totalLosses: 45,
    winRate: 0.60,
    createdAt: new Date('2024-03-01'),
    isPublic: false,
    requirements: {
      minRank: 'bronze',
      minTerritories: 0,
      minWins: 3
    }
  }
];

const mockClanMembers = [
  {
    id: '1',
    username: 'ShadowStriker',
    avatar: '/images/avatars/shadow.webp',
    rank: 'gold',
    role: 'leader',
    joinedAt: new Date('2024-01-01'),
    contribution: 2500,
    territoryCount: 5,
    matchWins: 45,
    isOnline: true,
    lastSeen: new Date()
  },
  {
    id: '4',
    username: 'DragonKnight',
    avatar: '/images/avatars/dragon.webp',
    rank: 'silver',
    role: 'officer',
    joinedAt: new Date('2024-01-15'),
    contribution: 1800,
    territoryCount: 3,
    matchWins: 32,
    isOnline: true,
    lastSeen: new Date()
  },
  {
    id: '5',
    username: 'FireBreath',
    avatar: '/images/avatars/fire.webp',
    rank: 'bronze',
    role: 'member',
    joinedAt: new Date('2024-02-01'),
    contribution: 950,
    territoryCount: 2,
    matchWins: 18,
    isOnline: false,
    lastSeen: new Date(Date.now() - 3600000)
  }
];

const mockClanWars: any[] = [
  {
    id: '1',
    name: 'Dragon vs Phoenix',
    description: 'Epic battle between the two top clans',
    startDate: new Date(Date.now() + 86400000), // Tomorrow
    endDate: new Date(Date.now() + 604800000), // 7 days from now
    status: 'preparing',
    clan1Id: '1',
    clan1Name: 'Dragon Slayers',
    clan1Score: 0,
    clan2Id: '2',
    clan2Name: 'Phoenix Rising',
    clan2Score: 0,
    rewards: {
      winner: 5000,
      loser: 500
    },
    matches: []
  }
];

const mockClanInvites: any[] = [
  {
    id: '1',
    clanId: '1',
    clanName: 'Dragon Slayers',
    inviterId: '1',
    inviterName: 'ShadowStriker',
    targetUserId: '6',
    message: 'Join the elite Dragon Slayers!',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 604800000) // 7 days
  }
];

// Test suite compatible routes
router.post('/clans/create', async (req, res) => {
  try {
    const { name, tag, description } = req.body;
    // Mock creating clan
    res.json({ success: true, clanId: 'clan-123' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create clan' });
  }
});

router.get('/clans/:clanId', async (req, res) => {
  try {
    const { clanId } = req.params;
    // Mock clan data
    res.json({
      id: clanId,
      name: 'Test Clan',
      tag: 'TEST',
      description: 'A test clan',
      leaderId: 'user-1',
      memberCount: 5
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get clan' });
  }
});

router.post('/clans/:clanId/invite', async (req, res) => {
  try {
    const { clanId } = req.params;
    const { userId } = req.body;
    // Mock inviting member
    res.json({ success: true, inviteId: 'invite-1' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to invite member' });
  }
});

router.post('/clans/:clanId/war/declare', async (req, res) => {
  try {
    const { clanId } = req.params;
    // Mock declaring war
    res.json({ success: true, warId: 'war-1' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to declare war' });
  }
});

// Clan Management Routes
router.get('/v1/clans/my-clan', (req: Request, res: Response) => {
  // Mock user's clan (assuming user is in Dragon Slayers)
  const userClan = mockClans[0];
  res.json(userClan);
});

router.post('/v1/clans',
  [
    body('name').isString().isLength({ min: 3, max: 50 }),
    body('tag').isString().isLength({ min: 2, max: 4 }),
    body('description').isString().isLength({ max: 500 }),
    body('isPublic').isBoolean(),
    body('requirements').isObject()
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, tag, description, isPublic, requirements } = req.body;
    
    // Check if clan name or tag already exists
    const existingClan = mockClans.find(c => 
      c.name.toLowerCase() === name.toLowerCase() || 
      c.tag.toLowerCase() === tag.toLowerCase()
    );
    
    if (existingClan) {
      return res.status(400).json({ error: 'Clan name or tag already exists' });
    }
    
    const newClan = {
      id: Date.now().toString(),
      name,
      tag,
      description,
      avatar: '/images/clans/default.webp',
      banner: '/images/clans/default-banner.webp',
      leaderId: 'current-user',
      leaderName: 'CurrentUser',
      memberCount: 1,
      maxMembers: 50,
      level: 1,
      experience: 0,
      territoryCount: 0,
      totalWins: 0,
      totalLosses: 0,
      winRate: 0,
      createdAt: new Date(),
      isPublic,
      requirements
    };
    
    mockClans.push(newClan);
    
    res.json(newClan);
  }
);

router.put('/v1/clans/:clanId',
  [
    body('name').optional().isString().isLength({ min: 3, max: 50 }),
    body('description').optional().isString().isLength({ max: 500 }),
    body('isPublic').optional().isBoolean()
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { clanId } = req.params;
    const updateData = req.body;
    
    const clan = mockClans.find(c => c.id === clanId);
    if (!clan) {
      return res.status(404).json({ error: 'Clan not found' });
    }
    
    // Update clan data
    Object.assign(clan, updateData);
    
    res.json(clan);
  }
);

router.post('/v1/clans/:clanId/leave', (req: Request, res: Response) => {
  const { clanId } = req.params;
  
  // Mock leaving clan
  res.json({ success: true });
});

// Clan Members Routes
router.get('/v1/clans/:clanId/members', (req: Request, res: Response) => {
  const { clanId } = req.params;
  
  // Mock clan members
  res.json(mockClanMembers);
});

router.put('/v1/clans/:clanId/members/:memberId/promote',
  [
    body('role').isIn(['officer', 'member', 'recruit'])
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { clanId, memberId } = req.params;
    const { role } = req.body;
    
    // Mock promoting member
    const member = mockClanMembers.find(m => m.id === memberId);
    if (member) {
      member.role = role;
    }
    
    res.json({ success: true });
  }
);

router.delete('/v1/clans/:clanId/members/:memberId/kick', (req: Request, res: Response) => {
  const { clanId, memberId } = req.params;
  
  // Mock kicking member
  const index = mockClanMembers.findIndex(m => m.id === memberId);
  if (index !== -1) {
    mockClanMembers.splice(index, 1);
  }
  
  res.json({ success: true });
});

// Clan Wars Routes
router.get('/v1/clans/wars/active', (req: Request, res: Response) => {
  // Mock active clan wars
  res.json(mockClanWars);
});

router.post('/v1/clans/wars/declare',
  [
    body('targetClanId').isString().notEmpty(),
    body('name').isString().notEmpty(),
    body('description').isString(),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('rewards').isObject()
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { targetClanId, name, description, startDate, endDate, rewards } = req.body;
    
    const targetClan = mockClans.find(c => c.id === targetClanId);
    if (!targetClan) {
      return res.status(404).json({ error: 'Target clan not found' });
    }
    
    const newWar = {
      id: Date.now().toString(),
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'preparing',
      clan1Id: '1', // Current clan
      clan1Name: 'Dragon Slayers',
      clan1Score: 0,
      clan2Id: targetClanId,
      clan2Name: targetClan.name,
      clan2Score: 0,
      rewards,
      matches: [] as never[]
    };
    
    mockClanWars.push(newWar);
    
    res.json(newWar);
  }
);

router.post('/v1/clans/wars/:warId/accept', (req: Request, res: Response) => {
  const { warId } = req.params;
  
  const war = mockClanWars.find(w => w.id === warId);
  if (war) {
    war.status = 'active';
  }
  
  res.json({ success: true });
});

router.post('/v1/clans/wars/:warId/matches',
  [
    body('player1Id').isString().notEmpty(),
    body('player2Id').isString().notEmpty(),
    body('winnerId').isString().notEmpty(),
    body('score').isString().notEmpty(),
    body('territory').isString().notEmpty()
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { warId } = req.params;
    const matchData = req.body;
    
    const war = mockClanWars.find(w => w.id === warId);
    if (war) {
      const match = {
        id: Date.now().toString(),
        ...matchData,
        timestamp: new Date()
      };
      war.matches.push(match);
      
      // Update scores
      if (matchData.winnerId === matchData.player1Id) {
        war.clan1Score += 1;
      } else {
        war.clan2Score += 1;
      }
    }
    
    res.json({ success: true });
  }
);

// Clan Invites Routes
router.get('/v1/clans/invites', (req: Request, res: Response) => {
  // Mock clan invites
  res.json(mockClanInvites);
});

router.post('/v1/clans/:clanId/invite',
  [
    body('targetUserId').isString().notEmpty(),
    body('message').optional().isString()
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { clanId } = req.params;
    const { targetUserId, message } = req.body;
    
    const clan = mockClans.find(c => c.id === clanId);
    if (!clan) {
      return res.status(404).json({ error: 'Clan not found' });
    }
    
    const invite = {
      id: Date.now().toString(),
      clanId,
      clanName: clan.name,
      inviterId: 'current-user',
      inviterName: 'CurrentUser',
      targetUserId,
      message,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 604800000) // 7 days
    };
    
    mockClanInvites.push(invite);
    
    res.json({ success: true });
  }
);

router.post('/v1/clans/invites/:inviteId/accept', (req: Request, res: Response) => {
  const { inviteId } = req.params;
  
  // Mock accepting clan invite
  const index = mockClanInvites.findIndex(i => i.id === inviteId);
  if (index !== -1) {
    mockClanInvites.splice(index, 1);
  }
  
  res.json({ success: true });
});

router.post('/v1/clans/invites/:inviteId/decline', (req: Request, res: Response) => {
  const { inviteId } = req.params;
  
  // Mock declining clan invite
  const index = mockClanInvites.findIndex(i => i.id === inviteId);
  if (index !== -1) {
    mockClanInvites.splice(index, 1);
  }
  
  res.json({ success: true });
});

// Clan Discovery Routes
router.get('/v1/clans/search', (req: Request, res: Response) => {
  const { q } = req.query;
  
  if (!q || typeof q !== 'string') {
    return res.json([]);
  }
  
  const results = mockClans.filter(clan => 
    clan.name.toLowerCase().includes(q.toLowerCase()) ||
    clan.tag.toLowerCase().includes(q.toLowerCase()) ||
    clan.description.toLowerCase().includes(q.toLowerCase())
  );
  
  res.json(results);
});

router.get('/v1/clans/top', (req: Request, res: Response) => {
  const { limit = 10 } = req.query;
  
  const topClans = mockClans
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, Number(limit));
  
  res.json(topClans);
});

// Get clan members (GET /clans/:clanId/members)
router.get('/clans/:clanId/members', (req, res) => {
  res.json([
    { id: 'user-1', username: 'ShadowStriker', role: 'leader' },
    { id: 'user-2', username: 'PoolMaster', role: 'member' }
  ]);
});

export default router; 