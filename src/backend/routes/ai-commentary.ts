import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Test suite compatible routes
router.post('/ai/commentary/generate', async (req, res) => {
  try {
    const { matchId, eventType, eventData } = req.body;
    const commentary = {
      id: Date.now().toString(),
      matchId,
      timestamp: new Date(),
      type: eventType,
      content: `AI generated commentary for ${eventType} event`,
      confidence: 0.8,
      metadata: eventData,
      commentary: `Amazing ${eventType} event! The player shows incredible skill.`,
      audioUrl: `https://example.com/audio/${matchId}_${Date.now()}.mp3`
    };
    res.json(commentary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate commentary' });
  }
});

router.get('/ai/commentary/history/:matchId', (req, res) => {
  const { matchId } = req.params;
  res.json([
    {
      id: 'comment-1',
      matchId,
      timestamp: new Date(),
      type: 'shot',
      content: 'Great shot!',
      commentary: 'Excellent execution of a difficult shot.',
      audioUrl: `https://example.com/audio/${matchId}_1.mp3`
    },
    {
      id: 'comment-2',
      matchId,
      timestamp: new Date(),
      type: 'foul',
      content: 'Foul detected!',
      commentary: 'That was a clear foul.',
      audioUrl: `https://example.com/audio/${matchId}_2.mp3`
    }
  ]);
});

export default router; 