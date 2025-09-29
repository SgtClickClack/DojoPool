/**
 * MSW Handlers
 * 
 * Mock API handlers for testing and development.
 */

import { http, HttpResponse } from 'msw';

// Mock data
const mockUsers = [
  {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    name: 'Test User',
    role: 'USER',
    clanId: null,
    clanRole: null,
    avatarUrl: null,
    isAdmin: false,
  },
  {
    id: 'user-2',
    email: 'admin@example.com',
    username: 'admin',
    name: 'Admin User',
    role: 'ADMIN',
    clanId: null,
    clanRole: null,
    avatarUrl: null,
    isAdmin: true,
  },
];

const mockDojos = [
  {
    id: 'dojo-1',
    name: 'Test Dojo',
    description: 'A test dojo',
    coordinates: {
      lat: 40.7128,
      lng: -74.0060,
    },
    controllingClanId: null,
    level: 1,
    defenseScore: 0,
  },
  {
    id: 'dojo-2',
    name: 'Another Dojo',
    description: 'Another test dojo',
    coordinates: {
      lat: 40.7589,
      lng: -73.9851,
    },
    controllingClanId: 'clan-1',
    level: 2,
    defenseScore: 100,
  },
];

const mockClans = [
  {
    id: 'clan-1',
    name: 'Test Clan',
    tag: 'TEST',
    description: 'A test clan',
    leaderId: 'user-1',
    memberCount: 5,
    level: 1,
  },
];

const mockMatches = [
  {
    id: 'match-1',
    playerAId: 'user-1',
    playerBId: 'user-2',
    status: 'SCHEDULED',
    scoreA: 0,
    scoreB: 0,
    createdAt: new Date().toISOString(),
  },
];

const mockNotifications = [
  {
    id: 'notification-1',
    userId: 'user-1',
    type: 'info',
    title: 'Welcome to Dojo Pool!',
    message: 'Welcome to the game!',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
];

// API handlers
export const handlers = [
  // Authentication endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    
    if (body.email === 'test@example.com' && body.password === 'password') {
      return HttpResponse.json({
        user: mockUsers[0],
        token: 'mock-jwt-token',
      });
    }
    
    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json() as { email: string; password: string; username: string };
    
    const newUser = {
      id: `user-${Date.now()}`,
      email: body.email,
      username: body.username,
      name: body.username,
      role: 'USER',
      clanId: null,
      clanRole: null,
      avatarUrl: null,
      isAdmin: false,
    };
    
    mockUsers.push(newUser);
    
    return HttpResponse.json({
      user: newUser,
      token: 'mock-jwt-token',
    });
  }),

  http.get('/api/users/me', ({ request }) => {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json(mockUsers[0]);
  }),

  // Dojo endpoints
  http.get('/api/v1/dojos', () => {
    return HttpResponse.json({
      dojos: mockDojos,
      total: mockDojos.length,
    });
  }),

  http.get('/api/v1/dojos/:id', ({ params }) => {
    const dojo = mockDojos.find(d => d.id === params.id);
    
    if (!dojo) {
      return HttpResponse.json(
        { error: 'Dojo not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(dojo);
  }),

  // Clan endpoints
  http.get('/api/v1/clans', () => {
    return HttpResponse.json({
      clans: mockClans,
      total: mockClans.length,
    });
  }),

  http.post('/api/v1/clans', async ({ request }) => {
    const body = await request.json() as { name: string; tag: string; description: string };
    
    const newClan = {
      id: `clan-${Date.now()}`,
      name: body.name,
      tag: body.tag,
      description: body.description,
      leaderId: 'user-1',
      memberCount: 1,
      level: 1,
    };
    
    mockClans.push(newClan);
    
    return HttpResponse.json(newClan);
  }),

  // Match endpoints
  http.get('/api/v1/matches', () => {
    return HttpResponse.json({
      matches: mockMatches,
      total: mockMatches.length,
    });
  }),

  http.post('/api/v1/matches', async ({ request }) => {
    const body = await request.json() as { playerAId: string; playerBId: string };
    
    const newMatch = {
      id: `match-${Date.now()}`,
      playerAId: body.playerAId,
      playerBId: body.playerBId,
      status: 'SCHEDULED',
      scoreA: 0,
      scoreB: 0,
      createdAt: new Date().toISOString(),
    };
    
    mockMatches.push(newMatch);
    
    return HttpResponse.json(newMatch);
  }),

  // Notification endpoints
  http.get('/api/v1/notifications', () => {
    return HttpResponse.json({
      notifications: mockNotifications,
      unreadCount: mockNotifications.filter(n => !n.isRead).length,
      totalCount: mockNotifications.length,
    });
  }),

  http.post('/api/v1/notifications/:id/read', ({ params }) => {
    const notification = mockNotifications.find(n => n.id === params.id);
    
    if (notification) {
      notification.isRead = true;
    }
    
    return HttpResponse.json({ success: true });
  }),

  // Venue endpoints
  http.get('/api/v1/venues', () => {
    return HttpResponse.json({
      venues: mockDojos.map(dojo => ({
        id: dojo.id,
        name: dojo.name,
        description: dojo.description,
        lat: dojo.coordinates.lat,
        lng: dojo.coordinates.lng,
        address: `${dojo.name} Address`,
        ownerId: null,
      })),
      total: mockDojos.length,
    });
  }),

  // Dashboard endpoints
  http.get('/api/v1/dashboard/stats', () => {
    return HttpResponse.json({
      totalUsers: mockUsers.length,
      totalDojos: mockDojos.length,
      totalClans: mockClans.length,
      totalMatches: mockMatches.length,
      activeUsers: mockUsers.length,
      onlineUsers: mockUsers.length,
    });
  }),

  // Error handling
  http.all('*', ({ request }) => {
    console.warn(`Unhandled ${request.method} request to ${request.url}`);
    return HttpResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }),
];
