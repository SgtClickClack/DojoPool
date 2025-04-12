import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../../types/user';
import { UserService } from '../database/UserService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';
const SALT_ROUNDS = 10;

export class AuthService {
  static generateToken(user: User): string {
    return jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static async validateUser(email: string, password: string): Promise<User | null> {
    const user = await UserService.findUserByEmail(email);
    if (!user) return null;
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return null;
    
    return user;
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  static async refreshToken(token: string): Promise<string> {
    const decoded = this.verifyToken(token);
    const user = await UserService.findUserById(decoded.id);
    if (!user) throw new Error('User not found');
    
    return this.generateToken(user);
  }
} 