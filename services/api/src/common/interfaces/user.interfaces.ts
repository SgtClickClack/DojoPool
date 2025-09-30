import type { Prisma, User } from '@prisma/client';

export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage';

export type PermissionResource =
  | 'user'
  | 'tournament'
  | 'venue'
  | 'admin'
  | 'content'
  | 'match'
  | 'clan'
  | 'territory';

export interface PermissionContext {
  resourceId?: string;
  ownerId?: string;
  venueId?: string;
  [key: string]: unknown;
}

/**
 * Core user management interface
 */
export interface IUserService {
  createUser(data: Prisma.UserCreateInput): Promise<User>;
  findAllUsers(): Promise<User[]>;
  findUserById(id: string): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserByUsername(username: string): Promise<User | null>;
  updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User>;
  deleteUser(id: string): Promise<User>;
}

/**
 * User profile management interface
 */
export interface IUserProfileService {
  updateProfile(
    userId: string,
    updateProfileDto: {
      bio?: string;
      location?: string;
      preferredGameMode?: string;
    }
  ): Promise<User>;
  uploadAvatar(
    userId: string,
    file: Express.Multer.File
  ): Promise<{ avatarUrl: string }>;
}

/**
 * User wallet management interface
 */
export interface IUserWalletService {
  getBalance(userId: string): Promise<number>;
  addToBalance(
    userId: string,
    amount: number,
    description: string,
    reference?: string
  ): Promise<User>;
  deductFromBalance(
    userId: string,
    amount: number,
    description: string,
    reference?: string
  ): Promise<User>;
  transferBalance(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description: string,
    reference?: string
  ): Promise<{ fromUser: User; toUser: User }>;
}

/**
 * Permissions service interface
 */
export interface IPermissionsService {
  can(
    user: User | null | undefined,
    action: PermissionAction,
    resource: PermissionResource,
    context?: PermissionContext
  ): boolean;
  hasRole(user: User | null | undefined, role: string): boolean;
  isAdmin(user: User | null | undefined): boolean;
  isVenueAdmin(user: User | null | undefined): boolean;
  isOwner(user: User | null | undefined, resourceOwnerId: string): boolean;
}

/**
 * Authentication service interface
 */
export interface IAuthService {
  register(data: {
    email: string;
    username: string;
    password: string;
  }): Promise<{ user: User; accessToken: string; refreshToken: string }>;
  login(data: {
    email: string;
    password: string;
  }): Promise<{ user: User; accessToken: string; refreshToken: string }>;
  validateUser(payload: {
    sub: string;
    username: string;
    role: string;
  }): Promise<User | null>;
  issueTokens(payload: {
    userId: string;
    username: string;
    role: string;
  }): Promise<{ accessToken: string; refreshToken: string }>;
}

// Injection tokens
export const USER_SERVICE_TOKEN = Symbol('IUserService');
export const USER_PROFILE_SERVICE_TOKEN = Symbol('IUserProfileService');
export const USER_WALLET_SERVICE_TOKEN = Symbol('IUserWalletService');
export const PERMISSIONS_SERVICE_TOKEN = Symbol('IPermissionsService');
export const AUTH_SERVICE_TOKEN = Symbol('IAuthService');
