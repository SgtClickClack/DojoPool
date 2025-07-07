/**
 * Investor portal authentication routes
 * Replaces hardcoded password with proper server-side authentication
 */

import { Router, Request, Response } from 'express';
import { InvestorAuthService } from '../services/auth/InvestorAuthService';

const router = Router();

/**
 * POST /api/investor/auth/login
 * Authenticate investor user
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    const result = await InvestorAuthService.authenticateUser(email, password);

    if (!result.success) {
      return res.status(401).json({ 
        success: false, 
        error: result.error 
      });
    }

    // Set secure HTTP-only cookie
    res.cookie('investor_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      success: true,
      user: {
        id: result.user!.id,
        email: result.user!.email,
        name: result.user!.name,
        accessLevel: result.user!.accessLevel
      }
    });
  } catch (error) {
    console.error('Investor login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
});

/**
 * POST /api/investor/auth/logout
 * Logout investor user
 */
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('investor_token');
  res.json({ success: true });
});

/**
 * GET /api/investor/auth/verify
 * Verify current authentication status
 */
router.get('/verify', (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.investor_token;

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    const { valid, user, error } = InvestorAuthService.verifyToken(token);

    if (!valid) {
      return res.status(401).json({ 
        success: false, 
        error: error || 'Invalid token' 
      });
    }

    const investorUser = InvestorAuthService.getUserById(user.userId);

    if (!investorUser) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        id: investorUser.id,
        email: investorUser.email,
        name: investorUser.name,
        accessLevel: investorUser.accessLevel
      }
    });
  } catch (error) {
    console.error('Investor verify error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Verification failed' 
    });
  }
});

/**
 * POST /api/investor/auth/refresh
 * Refresh authentication token
 */
router.post('/refresh', (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.investor_token;

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    const { valid, user, error } = InvestorAuthService.verifyToken(token);

    if (!valid) {
      return res.status(401).json({ 
        success: false, 
        error: error || 'Invalid token' 
      });
    }

    const result = InvestorAuthService.refreshToken(user.userId);

    if (!result.success) {
      return res.status(401).json({ 
        success: false, 
        error: result.error 
      });
    }

    // Set new secure HTTP-only cookie
    res.cookie('investor_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Investor refresh error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Token refresh failed' 
    });
  }
});

export default router; 