import express from 'express';
import EnhancedSocialCommunityService from '../../services/social/EnhancedSocialCommunityService';

const router = express.Router();
const enhancedSocialService = EnhancedSocialCommunityService.getInstance();

// Reputation System Routes
router.get('/reputation/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const reputation = enhancedSocialService.getReputation(userId);
    
    res.json({ userId, reputation });
  } catch (error) {
    console.error('Error fetching reputation:', error);
    res.status(500).json({ error: 'Failed to fetch reputation' });
  }
});

router.post('/reputation/:userId/event', async (req, res) => {
  try {
    const { userId } = req.params;
    const eventData = req.body;
    
    const event = enhancedSocialService.addReputationEvent({
      userId,
      ...eventData
    });
    res.json({ success: true, event });
  } catch (error) {
    console.error('Error adding reputation event:', error);
    res.status(500).json({ error: 'Failed to add reputation event' });
  }
});

// Community Challenges Routes
router.post('/challenges', async (req, res) => {
  try {
    const challengeData = req.body;
    const challenge = enhancedSocialService.createChallenge(challengeData);
    res.status(201).json(challenge);
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ error: 'Failed to create challenge' });
  }
});

router.get('/challenges', async (req, res) => {
  try {
    const { type, status, featured } = req.query;
    let challenges = enhancedSocialService.getActiveChallenges();
    
    if (featured === 'true') {
      challenges = enhancedSocialService.getFeaturedChallenges();
    }
    
    if (type) {
      challenges = challenges.filter((c: any) => c.type === type);
    }
    
    res.json(challenges);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

router.post('/challenges/:challengeId/join', async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { userId } = req.body;
    
    const success = enhancedSocialService.joinChallenge(challengeId, userId);
    res.json({ success, message: success ? 'Joined challenge' : 'Failed to join challenge' });
  } catch (error) {
    console.error('Error joining challenge:', error);
    res.status(500).json({ error: 'Failed to join challenge' });
  }
});

router.post('/challenges/:challengeId/submit', async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { userId, submission } = req.body;
    
    const challengeSubmission = enhancedSocialService.submitChallengeEntry({
      challengeId,
      userId,
      ...submission
    });
    res.json(challengeSubmission);
  } catch (error) {
    console.error('Error submitting challenge entry:', error);
    res.status(500).json({ error: 'Failed to submit challenge entry' });
  }
});

// Social Groups Routes
router.post('/groups', async (req, res) => {
  try {
    const groupData = req.body;
    const group = enhancedSocialService.createGroup(groupData);
    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

router.get('/groups', async (req, res) => {
  try {
    const { type } = req.query;
    let groups = enhancedSocialService.getGroupsByType(type as any || 'clan');
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

router.post('/groups/:groupId/join', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    
    const success = enhancedSocialService.joinGroup(groupId, userId);
    res.json({ success, message: success ? 'Successfully joined group' : 'Failed to join group' });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

// Social Events Routes
router.post('/events', async (req, res) => {
  try {
    const eventData = req.body;
    const event = enhancedSocialService.createEvent(eventData);
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.get('/events', async (req, res) => {
  try {
    const { type, featured } = req.query;
    let events = enhancedSocialService.getUpcomingEvents();
    
    if (featured === 'true') {
      events = enhancedSocialService.getFeaturedEvents();
    }
    
    if (type) {
      events = events.filter((e: any) => e.type === type);
    }
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.post('/events/:eventId/register', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;
    
    const success = enhancedSocialService.registerForEvent(eventId, userId);
    res.json({ success, message: success ? 'Registered for event' : 'Failed to register for event' });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ error: 'Failed to register for event' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString()
  });
});

export default router; 