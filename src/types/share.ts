export type ShareType = 'game' | 'tournament' | 'achievement' | 'profile' | 'shot' | 'venue';

export interface Share {
  id: number;
  user_id: number;
  content_type: ShareType;
  content_id: number;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    username: string;
    avatar_url?: string;
  };
} 