export interface Profile {
  id: string;
  userId: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  skillLevel: number;
  preferredGame?: string;
  createdAt: Date;
  updatedAt: Date;
} 