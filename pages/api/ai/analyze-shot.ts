import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import axios from 'axios';

// Disable bodyParser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

interface ShotMetrics {
  velocity: number;
  spin: number;
  accuracy: number;
  difficulty: number;
  anglePrecision: number;
  powerControl: number;
  shotType: string;
}

interface FrameData {
  timestamp: number;
  ballPositions: { x: number, y: number }[];
  stickPosition: { x: number, y: number, angle: number };
  prediction?: { x: number, y: number };
}

interface ShotAnalysis {
  success: boolean;
  error?: string;
  metrics?: ShotMetrics;
  recommendations?: string[];
  summary?: string;
  frames?: FrameData[];
  score?: number;
}

// Helper function to generate random metrics for development
function generateMockAnalysis(): ShotAnalysis {
  // Generate mock metrics
  const metrics: ShotMetrics = {
    velocity: Math.random() * 20 + 5, // 5-25 mph
    spin: Math.random() * 1000 + 200, // 200-1200 rpm
    accuracy: Math.random() * 0.7 + 0.3, // 30-100%
    difficulty: Math.random() * 8 + 2, // 2-10
    anglePrecision: Math.random() * 0.9 + 0.1, // 10-100%
    powerControl: Math.random() * 0.9 + 0.1, // 10-100%
    shotType: ['Standard', 'Draw', 'Follow', 'Bank', 'Jump', 'Masse'][Math.floor(Math.random() * 6)],
  };

  // Calculate score based on metrics
  const score = Math.round(
    (metrics.accuracy * 40) +
    (metrics.anglePrecision * 25) +
    (metrics.powerControl * 25) +
    (10 - metrics.difficulty)
  );

  // Generate mock frames
  const frameCount = 20;
  const frames: FrameData[] = [];
  
  // Initial positions
  const initialCueBall = { x: 0.2, y: 0.5 };
  const targetBall = { x: 0.6, y: 0.5 };
  
  // Direction vector
  const dirX = targetBall.x - initialCueBall.x;
  const dirY = targetBall.y - initialCueBall.y;
  const len = Math.sqrt(dirX * dirX + dirY * dirY);
  const normalizedDirX = dirX / len;
  const normalizedDirY = dirY / len;
  
  // Generate frames
  for (let i = 0; i < frameCount; i++) {
    const t = i / (frameCount - 1);
    
    // Cue ball trajectory (moves toward target ball for first half, then changes direction)
    let cueBallX, cueBallY;
    if (t < 0.5) {
      // First half: move toward target ball
      cueBallX = initialCueBall.x + t * 2 * dirX;
      cueBallY = initialCueBall.y + t * 2 * dirY;
    } else {
      // Second half: continue in a slightly different direction
      const newT = (t - 0.5) * 2;
      const newDirX = normalizedDirX + Math.random() * 0.2 - 0.1;
      const newDirY = normalizedDirY + Math.random() * 0.2 - 0.1;
      cueBallX = targetBall.x + newT * newDirX * 0.8;
      cueBallY = targetBall.y + newT * newDirY * 0.8;
    }
    
    // Target ball trajectory (starts moving after being hit)
    let targetBallX, targetBallY;
    if (t < 0.5) {
      // First half: stationary
      targetBallX = targetBall.x;
      targetBallY = targetBall.y;
    } else {
      // Second half: moves in a slightly different direction
      const newT = (t - 0.5) * 2;
      targetBallX = targetBall.x + newT * normalizedDirX * 0.6;
      targetBallY = targetBall.y + newT * normalizedDirY * 0.6;
    }
    
    frames.push({
      timestamp: t * 2, // 0-2 seconds
      ballPositions: [
        { x: cueBallX, y: cueBallY }, // Cue ball
        { x: targetBallX, y: targetBallY }, // Target ball
      ],
      stickPosition: {
        x: initialCueBall.x - normalizedDirX * 0.1,
        y: initialCueBall.y - normalizedDirY * 0.1,
        angle: Math.atan2(normalizedDirY, normalizedDirX)
      }
    });
  }

  // Generate mock recommendations
  const recommendations = [
    'Keep your bridge hand more stable to improve accuracy.',
    'Apply slight right English to improve the angle on this shot.',
    'For bank shots, aim slightly thinner than you might expect.',
    'Work on your follow-through to maintain better control of the cue ball.',
    'Consider using less power for better position control.',
    'Practice this shot from different angles to build consistency.',
  ];
  
  // Randomly select 3-5 recommendations
  const recommendationCount = Math.floor(Math.random() * 3) + 3;
  const shuffledRecommendations = [...recommendations].sort(() => 0.5 - Math.random());
  const selectedRecommendations = shuffledRecommendations.slice(0, recommendationCount);

  return {
    success: true,
    metrics,
    recommendations: selectedRecommendations,
    summary: `This ${metrics.shotType.toLowerCase()} shot was executed with ${metrics.accuracy > 0.7 ? 'high' : metrics.accuracy > 0.4 ? 'moderate' : 'low'} accuracy. ${
      metrics.difficulty > 7 ? 'This was a challenging shot requiring precision.' : 
      metrics.difficulty > 4 ? 'This shot had moderate difficulty.' : 
      'This was a relatively standard shot.'
    }`,
    frames,
    score
  };
}

// Function to process video file and extract metrics
async function analyzeVideo(filePath: string): Promise<ShotAnalysis> {
  // In a real implementation, this would call the AI backend service
  // For demo purposes, we'll return mock data
  
  try {
    // Here you would normally process the video with your AI service
    // For example:
    // const result = await axios.post('http://your-ai-service/analyze', {
    //   videoPath: filePath
    // });
    
    // For now, return mock data
    return generateMockAnalysis();
    
  } catch (error) {
    console.error('Error analyzing video:', error);
    return {
      success: false,
      error: 'Failed to analyze video. Please try again.'
    };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const form = new IncomingForm({
      uploadDir: uploadsDir,
      keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form:', err);
        return res.status(500).json({ success: false, error: 'Failed to upload file' });
      }

      // Get the uploaded file
      const fileArray = files.shot_video;
      if (!fileArray || !Array.isArray(fileArray) || fileArray.length === 0) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const file = fileArray[0];
      if (!file.filepath) {
        return res.status(400).json({ success: false, error: 'Invalid file' });
      }

      try {
        // Process the video and get analysis
        const analysis = await analyzeVideo(file.filepath);

        // Return the analysis results
        res.status(200).json(analysis);

        // Clean up the file after processing
        fs.unlink(file.filepath, (err) => {
          if (err) console.error('Error removing temp file:', err);
        });
      } catch (error) {
        console.error('Error processing video:', error);
        res.status(500).json({ success: false, error: 'Failed to process video' });
      }
    });
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}