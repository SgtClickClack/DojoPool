import express from 'express';
import AdvancedSocialCommunityService from '../../config/monitoring.js';

const router = express.Router();
const advancedSocialService = AdvancedSocialCommunityService.getInstance();

// Social Posts Routes
router.post('/posts', async (req, res) => {
  try {
    const postData = req.body;
    const post = advancedSocialService.createPost(postData);
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

router.get('/posts', async (req, res) => {
  try {
    const { userId, limit } = req.query;
    const posts = advancedSocialService.getPosts(
      userId as string, 
      limit ? parseInt(limit as string) : 20
    );
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.post('/posts/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;
    
    const success = advancedSocialService.likePost(postId, userId);
    res.json({ success, message: success ? 'Post liked' : 'Failed to like post' });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

router.post('/posts/:postId/comment', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, content } = req.body;
    
    const comment = advancedSocialService.commentOnPost(postId, {
      postId,
      userId,
      content
    });
    res.json(comment);
  } catch (error) {
    console.error('Error commenting on post:', error);
    res.status(500).json({ error: 'Failed to comment on post' });
  }
});

router.post('/posts/:postId/share', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;
    
    const success = advancedSocialService.sharePost(postId, userId);
    res.json({ success, message: success ? 'Post shared' : 'Failed to share post' });
  } catch (error) {
    console.error('Error sharing post:', error);
    res.status(500).json({ error: 'Failed to share post' });
  }
});

// Leaderboard Routes
router.get('/leaderboards/:type/:category', async (req, res) => {
  try {
    const { type, category } = req.params;
    const leaderboard = advancedSocialService.getLeaderboard(type as any, category as any);
    
    if (leaderboard) {
      res.json(leaderboard);
    } else {
      res.status(404).json({ error: 'Leaderboard not found' });
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Social Media Integration Routes
router.post('/social-media/connect', async (req, res) => {
  try {
    const integrationData = req.body;
    const integration = advancedSocialService.connectSocialMedia(integrationData);
    res.status(201).json(integration);
  } catch (error) {
    console.error('Error connecting social media:', error);
    res.status(500).json({ error: 'Failed to connect social media' });
  }
});

router.post('/social-media/auto-post', async (req, res) => {
  try {
    const { userId, content, platforms } = req.body;
    const results = await advancedSocialService.autoPostToSocialMedia(userId, content, platforms);
    res.json({ success: true, results });
  } catch (error) {
    console.error('Error auto-posting to social media:', error);
    res.status(500).json({ error: 'Failed to auto-post to social media' });
  }
});

// Community Moderation Routes
router.post('/moderation/report', async (req, res) => {
  try {
    const reportData = req.body;
    const report = advancedSocialService.reportUser(reportData);
    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

router.put('/moderation/:caseId/resolve', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { moderatorId, action } = req.body;
    
    const success = advancedSocialService.resolveModerationCase(caseId, moderatorId, action);
    res.json({ success, message: success ? 'Case resolved' : 'Failed to resolve case' });
  } catch (error) {
    console.error('Error resolving moderation case:', error);
    res.status(500).json({ error: 'Failed to resolve moderation case' });
  }
});

router.get('/moderation/cases', async (req, res) => {
  try {
    const { status } = req.query;
    const cases = advancedSocialService.getModerationCases(status as any);
    res.json(cases);
  } catch (error) {
    console.error('Error fetching moderation cases:', error);
    res.status(500).json({ error: 'Failed to fetch moderation cases' });
  }
});

// Analytics Routes
router.get('/analytics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { period } = req.query;
    
    const analytics = advancedSocialService.getSocialAnalytics(userId, period as any || 'daily');
    if (analytics) {
      res.json(analytics);
    } else {
      res.status(404).json({ error: 'Analytics not found' });
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Community Events Routes
router.post('/events', async (req, res) => {
  try {
    const eventData = req.body;
    const event = advancedSocialService.createCommunityEvent(eventData);
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.get('/events', async (req, res) => {
  try {
    const { featured } = req.query;
    let events = advancedSocialService.getActiveEvents();
    
    if (featured === 'true') {
      events = advancedSocialService.getFeaturedEvents();
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
    
    const success = advancedSocialService.registerForEvent(eventId, userId);
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
    timestamp: new Date().toISOString(),
    service: 'Advanced Social Community & Engagement Service'
  });
});

export default router; 


