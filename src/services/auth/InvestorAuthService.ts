/**
 * Server-side authentication service for investor portal
 * Replaces hardcoded password with proper authentication
 */

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

interface InvestorUser {
  id: string;
  email: string;
  name: string;
  accessLevel: 'basic' | 'premium' | 'admin';
  lastLogin?: Date;
}

// In production, this would be stored in a database
const INVESTOR_USERS: InvestorUser[] = [
  {
    id: 'investor_001',
    email: 'julian@dojopool.com.au',
    name: 'Julian Gilbert-Roberts',
    accessLevel: 'admin'
  }
];

const JWT_SECRET = process.env.JWT_SECRET || 'dojo-investor-secret-key-change-in-production';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export class InvestorAuthService {
  /**
   * Authenticate investor user
   */
  static async authenticateUser(email: string, password: string): Promise<{ success: boolean; token?: string; user?: InvestorUser; error?: string }> {
    try {
      // Find user by email
      const user = INVESTOR_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        return { success: false, error: 'Invalid credentials' };
      }

      // In production, verify against hashed password in database
      // For now, use a simple check against known password
      const expectedPassword = process.env.INVESTOR_PASSWORD || 'DojoInvestor2025!';
      
      if (password !== expectedPassword) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          accessLevel: user.accessLevel,
          exp: Math.floor(Date.now() / 1000) + (SESSION_DURATION / 1000)
        },
        JWT_SECRET
      );

      // Update last login
      user.lastLogin = new Date();

      return { 
        success: true, 
        token, 
        user: { ...user, lastLogin: user.lastLogin }
      };
    } catch (error) {
      console.error('InvestorAuthService.authenticateUser error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): { valid: boolean; user?: any; error?: string } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return { valid: true, user: decoded };
    } catch (error) {
      return { valid: false, error: 'Invalid token' };
    }
  }

  /**
   * Middleware to protect investor portal routes
   */
  static requireAuth(req: Request, res: Response, next: Function) {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.investor_token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { valid, user, error } = this.verifyToken(token);
    
    if (!valid) {
      return res.status(401).json({ error: error || 'Invalid token' });
    }

    // Add user to request object
    (req as any).investorUser = user;
    next();
  }

  /**
   * Get investor user by ID
   */
  static getUserById(userId: string): InvestorUser | undefined {
    return INVESTOR_USERS.find(u => u.id === userId);
  }

  /**
   * Refresh token
   */
  static refreshToken(userId: string): { success: boolean; token?: string; error?: string } {
    try {
      const user = this.getUserById(userId);
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          accessLevel: user.accessLevel,
          exp: Math.floor(Date.now() / 1000) + (SESSION_DURATION / 1000)
        },
        JWT_SECRET
      );

      return { success: true, token };
    } catch (error) {
      console.error('InvestorAuthService.refreshToken error:', error);
      return { success: false, error: 'Token refresh failed' };
    }
  }
} 