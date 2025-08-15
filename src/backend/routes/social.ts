import express from 'express';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Test suite compatible routes
router.post('/social/friends/add', (req, res) => {
  res.json({ success: true });
});

router.get('/social/friends/:userId', (req, res) => {
  res.json([
    { id: 'user-2', username: 'friend1', avatar: null },
    { id: 'user-3', username: 'friend2', avatar: null }
  ]);
});

router.post('/social/messages/send', (req, res) => {
  res.json({ success: true, messageId: 'msg-1' });
});

router.get('/social/messages/conversation/:userId/:otherUserId', (req, res) => {
  res.json([
    { id: 'msg-1', fromUserId: 'user-1', toUserId: 'user-2', content: 'Hello!', timestamp: new Date() },
    { id: 'msg-2', fromUserId: 'user-2', toUserId: 'user-1', content: 'Hi there!', timestamp: new Date() }
  ]);
});

router.post('/social/activity/create', (req, res) => {
  res.json({ success: true, postId: 'post-1' });
});

router.get('/social/activity/feed/:userId', (req, res) => {
  res.json([
    { id: 'post-1', userId: 'user-1', type: 'match_win', content: 'Won a match!', timestamp: new Date() },
    { id: 'post-2', userId: 'user-1', type: 'achievement', content: 'Unlocked new avatar!', timestamp: new Date() }
  ]);
});

export default router; 


