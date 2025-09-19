import type { JournalResponse } from '@/types/journal';
import type {
  MarkAsReadResponse,
  NotificationResponse,
} from '@/types/notification';
import type {
  Content,
  ContentFilter,
  ContentLikeResponse,
  ContentListResponse,
  ContentStats,
  ContentUploadData,
  ModerateContentRequest,
  UpdateContentRequest,
  UserContentListResponse,
} from '@/types/content';
import type {
  CreateFeedbackRequest,
  Feedback,
  FeedbackFilter,
  FeedbackListResponse,
  FeedbackStats,
  UpdateFeedbackRequest,
  UserFeedbackListResponse,
} from '@/types/feedback';
import axios, { type AxiosError, type AxiosInstance } from 'axios';

// Create axios instance with default config
const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:3002/api';

const api: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Export the axios instance as apiClient for backward compatibility
export const apiClient = api;

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Handle token refresh
    if (
      error.response?.status === 401 &&
      !originalRequest?.url?.includes('auth/refresh')
    ) {
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await api.post('/auth/refresh', {
          refresh_token: refreshToken,
        });
        const { token } = response.data;

        localStorage.setItem('auth_token', token);

        if (originalRequest) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Clan API functions
export const createClan = async (clanData: any): Promise<any> => {
  const response = await api.post('/v1/clans', clanData);
  return response.data;
};

export const getClans = async (filters?: any): Promise<any[]> => {
  const response = await api.get('/v1/clans', { params: filters });
  return response.data;
};

export const getClanDetails = async (clanId: string): Promise<any> => {
  const response = await api.get(`/v1/clans/${clanId}`);
  return response.data;
};

export const getClanMembers = async (clanId: string): Promise<any[]> => {
  const response = await api.get(`/v1/clans/${clanId}/members`);
  return response.data;
};

export const getClanControlledDojos = async (
  clanId: string
): Promise<any[]> => {
  const response = await api.get(`/v1/territories/clan/${clanId}`);
  return response.data;
};

// Strategic Map API functions
export interface StrategicTerritory {
  id: string;
  name: string;
  venueId: string;
  coordinates?: { lat: number; lng: number };
  owner?: { id: string; username: string } | null;
  clan?: { id: string; name: string } | null;
  level: number;
  defenseScore: number;
  strategicValue: number;
  resources: Record<string, number>;
}

export const getStrategicMap = async (
  bbox?: [number, number, number, number]
): Promise<StrategicTerritory[]> => {
  const params: any = {};
  if (bbox) params.bbox = bbox.join(',');
  const response = await api.get('/v1/territories/map', { params });
  return response.data;
};

export const scoutTerritory = async (
  territoryId: string,
  playerId: string
): Promise<{ success: boolean; eventId?: string }> => {
  const response = await api.post(`/v1/territories/${territoryId}/scout`, {
    playerId,
  });
  return response.data;
};

export const manageTerritory = async (
  territoryId: string,
  action: 'upgrade_defense' | 'allocate_resources' | 'transfer_ownership',
  payload?: any
): Promise<any> => {
  const response = await api.post(`/v1/territories/${territoryId}/manage`, {
    action,
    payload,
  });
  return response.data;
};

export const joinClan = async (
  clanId: string,
  message?: string
): Promise<void> => {
  const response = await api.post(`/v1/clans/${clanId}/join`, { message });
  return response.data;
};

export const leaveClan = async (clanId: string): Promise<void> => {
  const response = await api.post(`/v1/clans/${clanId}/leave`);
  return response.data;
};

// Activity Feed API functions
export const getActivityFeed = async (
  filter: 'global' | 'friends' = 'global',
  page: number = 1,
  limit: number = 20
): Promise<any> => {
  const mappedFilter = filter === 'global' ? 'all' : 'friends';
  const response = await api.get('/v1/feed', {
    params: { filter: mappedFilter, page, pageSize: limit },
  });
  const raw = response.data || {};

  const items: any[] = Array.isArray(raw.items) ? raw.items : [];
  const pageNumber: number = Number(raw.page ?? page);
  const pageSize: number = Number(raw.pageSize ?? limit);

  const entries = items.map((it: any) => ({
    id: it.id,
    type: it.type,
    title: it.type?.toString().replace(/_/g, ' ') || 'activity',
    description: it.message ?? '',
    userId: it.user?.id ?? it.userId ?? '',
    username: it.user?.username ?? 'Unknown',
    userAvatar: undefined,
    metadata: it.metadata ?? {},
    createdAt: it.createdAt,
    isPublic: true,
  }));

  return {
    entries,
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total: entries.length,
      totalPages: 1,
      hasNext: false,
      hasPrev: pageNumber > 1,
    },
  };
};

export const getUserClan = async (userId: string): Promise<any | null> => {
  try {
    const response = await api.get(`/v1/users/${userId}/clan`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const updateClan = async (
  clanId: string,
  updates: any
): Promise<any> => {
  const response = await api.patch(`/v1/clans/${clanId}`, updates);
  return response.data;
};

export const deleteClan = async (clanId: string): Promise<void> => {
  const response = await api.delete(`/v1/clans/${clanId}`);
  return response.data;
};

// Notification API functions
export const getNotifications = async (
  page: number = 1,
  limit: number = 50
): Promise<NotificationResponse> => {
  const response = await api.get('/v1/notifications', {
    params: { page, limit },
  });
  return response.data;
};

export const markNotificationAsRead = async (
  notificationId: string
): Promise<MarkAsReadResponse> => {
  const response = await api.patch(`/v1/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async (): Promise<{
  success: boolean;
}> => {
  const response = await api.patch('/v1/notifications/read-all');
  return response.data;
};

// Journal API functions
export const getMyJournal = async (
  page: number = 1,
  limit: number = 20
): Promise<JournalResponse> => {
  const response = await api.get('/v1/users/me/journal', {
    params: { page, limit },
  });
  return response.data;
};

// Authentication API functions
export const login = async (credentials: {
  email: string;
  password: string;
}) => {
  const response = await api.post('/v1/auth/login', credentials);
  return response.data;
};

export const register = async (userData: {
  email: string;
  password: string;
  username: string;
}) => {
  const response = await api.post('/v1/auth/register', userData);
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/v1/auth/logout');
  return response.data;
};

// Dashboard API functions
export interface DashboardStats {
  matches: {
    total: number;
    won: number;
    lost: number;
    winRate: number;
    thisMonth: number;
  };
  tournaments: {
    total: number;
    won: number;
    joined: number;
    upcoming: number;
  };
  clan: {
    name: string;
    rank: string;
    points: number;
    level: string;
  };
  dojoCoins: {
    balance: number;
    earned: number;
    spent: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    metadata?: any;
  }>;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.post('/v1/dashboard/stats');
  return response.data;
};

// CDN Cost Dashboard API functions
export interface CdnCostStats {
  totalCost: number;
  monthlyCost: number;
  dailyCost: number;
  bandwidth: {
    total: number;
    average: number;
    peak: number;
  };
  requests: {
    total: number;
    average: number;
    peak: number;
  };
  dailyBreakdown: Array<{
    date: string;
    cost: number;
    bandwidth: number;
    requests: number;
  }>;
  optimization: {
    savings: number;
    recommendations: string[];
  };
}

export const getCdnCostStats = async (): Promise<CdnCostStats> => {
  const response = await api.get('/v1/dashboard/cdn/cost');
  return response.data;
};

// Venue API functions
export const getVenues = async (params?: {
  search?: string;
  city?: string;
  state?: string;
  hasTournaments?: boolean;
  hasFood?: boolean;
  hasBar?: boolean;
  page?: number;
  limit?: number;
}): Promise<{
  venues: any[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const response = await api.get('/v1/venues', { params });
  return response.data;
};

// Dojo Upgrade API function
export const upgradeDojo = async (
  venueId: string,
  upgradeType: string
): Promise<any> => {
  const response = await api.post(`/v1/venues/${venueId}/upgrade`, {
    upgradeType,
  });
  return response.data;
};

export const initiateShadowRun = async (
  targetVenueId: string,
  runType: string
) => {
  const response = await api.post('/v1/shadow-runs', {
    targetVenueId,
    runType,
  });
  return response.data;
};

export const getClanShadowRuns = async (clanId: string) => {
  const response = await api.get(`/shadow-runs/clan/${clanId}`);
  return response.data;
};

// Venue Owner Portal API functions
export const updateMyVenue = async (data: {
  description?: string;
  images?: string[];
  hours?: Array<{ day: string; open: string; close: string; isOpen?: boolean }>;
}): Promise<any> => {
  const response = await api.patch('/v1/venues/me', data);
  return response.data;
};

export const getMyVenue = async (): Promise<any> => {
  const response = await api.get('/v1/venues/me');
  return response.data;
};

export const createVenueSpecial = async (data: {
  title: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
}): Promise<any> => {
  const response = await api.post('/v1/venues/me/specials', data);
  return response.data;
};

export const getMyVenueSpecials = async (): Promise<any[]> => {
  const response = await api.get('/v1/venues/me/specials');
  return response.data;
};

export const deleteVenueSpecial = async (
  specialId: string
): Promise<{ success: boolean }> => {
  const response = await api.delete(`/v1/venues/me/specials/${specialId}`);
  return response.data;
};

// Match control API functions
export const pauseMatch = async (
  matchId: string
): Promise<{ status: string }> => {
  const response = await api.post(`/v1/matches/${matchId}/pause`);
  return response.data;
};

export const resumeMatch = async (
  matchId: string
): Promise<{ status: string }> => {
  const response = await api.post(`/v1/matches/${matchId}/resume`);
  return response.data;
};

// Tournament API functions
export interface Tournament {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: 'REGISTRATION' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  maxPlayers?: number;
  entryFee?: number;
  prizePool?: number;
  venue?: {
    id: string;
    name: string;
    location?: string;
  };
  currentParticipants?: number;
  createdAt: string;
  updatedAt: string;
}

export const getTournaments = async (): Promise<Tournament[]> => {
  const response = await api.get('/v1/tournaments');
  return response.data;
};

export const getTournamentById = async (id: string): Promise<Tournament> => {
  const response = await api.get(`/v1/tournaments/${id}`);
  return response.data;
};

export const createTournament = async (
  tournamentData: Partial<Tournament>
): Promise<Tournament> => {
  const response = await api.post('/v1/tournaments', tournamentData);
  return response.data;
};

export const registerForTournament = async (
  tournamentId: string,
  userId: string
): Promise<{ success: boolean }> => {
  const response = await api.post(`/v1/tournaments/${tournamentId}/register`, {
    userId,
  });
  return response.data;
};

export const unregisterFromTournament = async (
  tournamentId: string,
  userId: string
): Promise<{ success: boolean }> => {
  const response = await api.post(
    `/v1/tournaments/${tournamentId}/unregister`,
    { userId }
  );
  return response.data;
};

// Inventory API functions (minimal, for frontend integration)
export interface EquipItemRequest {
  userId: string;
  itemId: string;
  equipmentSlot: any;
}

export interface UnequipItemRequest {
  userId: string;
  equipmentSlot: any;
}

export const getAllItems = async (): Promise<any[]> => {
  const response = await api.get('/v1/inventory/items');
  return response.data ?? [];
};

export const getPlayerInventory = async (userId: string): Promise<any[]> => {
  const response = await api.get(`/v1/inventory/${userId}`);
  return response.data ?? [];
};

export const getPlayerLoadout = async (userId: string): Promise<any | null> => {
  const response = await api.get(`/v1/inventory/${userId}/loadout`);
  return response.data ?? null;
};

export const equipItem = async (
  payload: EquipItemRequest
): Promise<{ success: boolean } | any> => {
  const response = await api.post('/v1/inventory/equip', payload);
  return response.data ?? { success: true };
};

export const unequipItem = async (
  payload: UnequipItemRequest
): Promise<{ success: boolean } | any> => {
  const response = await api.post('/v1/inventory/unequip', payload);
  return response.data ?? { success: true };
};

// Feedback API functions
export const submitFeedback = async (
  feedbackData: CreateFeedbackRequest
): Promise<Feedback> => {
  const response = await api.post('/v1/feedback', feedbackData);
  return response.data;
};

export const getMyFeedback = async (
  page: number = 1,
  limit: number = 10
): Promise<UserFeedbackListResponse> => {
  const response = await api.get('/v1/feedback/my', {
    params: { page, limit },
  });
  return response.data;
};

export const getMyFeedbackById = async (id: string): Promise<Feedback> => {
  const response = await api.get(`/v1/feedback/my/${id}`);
  return response.data;
};

export const deleteMyFeedback = async (id: string): Promise<void> => {
  await api.delete(`/v1/feedback/my/${id}`);
};

// Admin Feedback API functions
export const getAllFeedback = async (
  filters: FeedbackFilter = {},
  page: number = 1,
  limit: number = 20
): Promise<FeedbackListResponse> => {
  const response = await api.get('/v1/feedback/admin', {
    params: { ...filters, page, limit },
  });
  return response.data;
};

export const getFeedbackStats = async (): Promise<FeedbackStats> => {
  const response = await api.get('/v1/feedback/admin/stats');
  return response.data;
};

export const getFeedbackById = async (id: string): Promise<Feedback> => {
  const response = await api.get(`/v1/feedback/admin/${id}`);
  return response.data;
};

export const updateFeedback = async (
  id: string,
  updateData: UpdateFeedbackRequest
): Promise<Feedback> => {
  const response = await api.put(`/v1/feedback/admin/${id}`, updateData);
  return response.data;
};

// Content API functions
export const uploadContent = async (
  contentData: ContentUploadData
): Promise<Content> => {
  const formData = new FormData();

  // Add file if provided
  if (contentData.file) {
    formData.append('file', contentData.file);
  }

  // Add other data
  Object.entries(contentData).forEach(([key, value]) => {
    if (key !== 'file' && value !== undefined) {
      if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });

  const response = await api.post('/v1/content', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getContentFeed = async (
  filters: ContentFilter = {},
  page: number = 1,
  limit: number = 20
): Promise<ContentListResponse> => {
  const response = await api.get('/v1/content/feed', {
    params: { ...filters, page, limit },
  });
  return response.data;
};

export const getUserContent = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<UserContentListResponse> => {
  const response = await api.get(`/v1/content/user/${userId}`, {
    params: { page, limit },
  });
  return response.data;
};

export const getContentById = async (id: string): Promise<Content> => {
  const response = await api.get(`/v1/content/${id}`);
  return response.data;
};

export const updateContent = async (
  id: string,
  updateData: UpdateContentRequest
): Promise<Content> => {
  const response = await api.put(`/v1/content/${id}`, updateData);
  return response.data;
};

export const deleteContent = async (id: string): Promise<void> => {
  await api.delete(`/v1/content/${id}`);
};

// Social features
export const likeContent = async (
  contentId: string
): Promise<ContentLikeResponse> => {
  const response = await api.post(`/v1/content/${contentId}/like`);
  return response.data;
};

export const shareContent = async (
  contentId: string,
  sharedWithIds: string[]
): Promise<{ success: boolean }> => {
  const response = await api.post(`/v1/content/${contentId}/share`, {
    sharedWithIds,
  });
  return response.data;
};

// Admin Content API functions
export const getAllContent = async (
  filters: ContentFilter = {},
  page: number = 1,
  limit: number = 20
): Promise<ContentListResponse> => {
  const response = await api.get('/v1/content/admin/all', {
    params: { ...filters, page, limit },
  });
  return response.data;
};

export const getContentStats = async (): Promise<ContentStats> => {
  const response = await api.get('/v1/content/admin/stats');
  return response.data;
};

export const moderateContent = async (
  id: string,
  moderationData: ModerateContentRequest
): Promise<Content> => {
  const response = await api.put(
    `/v1/content/admin/${id}/moderate`,
    moderationData
  );
  return response.data;
};

// CMS API functions
export interface CMSEvent {
  id: string;
  title: string;
  description?: string;
  eventDate?: string;
  location?: string;
  venueId?: string;
  maxAttendees?: string;
  registrationDeadline?: string;
  eventType?: string;
  status: string;
  tags?: string[];
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CMSNewsArticle {
  id: string;
  title: string;
  description: string;
  content?: string;
  summary?: string;
  category?: string;
  featuredImage?: string;
  isFeatured: boolean;
  author?: string;
  publishDate?: string;
  status: string;
  tags?: string[];
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CMSSystemMessage {
  id: string;
  title: string;
  message: string;
  messageType: string;
  priority: string;
  expiresAt?: string;
  isActive: boolean;
  targetAudience?: string;
  targetUserIds?: string[];
  status: string;
  tags?: string[];
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CMSStats {
  totalEvents: number;
  totalNewsArticles: number;
  totalSystemMessages: number;
  activeSystemMessages: number;
  pendingContent: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  eventDate?: string;
  location?: string;
  venueId?: string;
  maxAttendees?: string;
  registrationDeadline?: string;
  eventType?: string;
  tags?: string[];
  metadata?: any;
}

export interface CreateNewsArticleRequest {
  title: string;
  description: string;
  content?: string;
  summary?: string;
  category?: string;
  featuredImage?: string;
  isFeatured?: boolean;
  author?: string;
  publishDate?: string;
  tags?: string[];
  metadata?: any;
}

export interface CreateSystemMessageRequest {
  title: string;
  message: string;
  messageType?: string;
  priority?: string;
  expiresAt?: string;
  isActive?: boolean;
  targetAudience?: string;
  targetUserIds?: string[];
  tags?: string[];
  metadata?: any;
}

// CMS Events API
export const getCMSEvents = async (
  page: number = 1,
  limit: number = 20
): Promise<{ content: CMSEvent[]; totalCount: number; pagination: any }> => {
  const response = await api.get('/cms/events', {
    params: { page, limit },
  });
  return response.data;
};

export const createCMSEvent = async (
  eventData: CreateEventRequest
): Promise<CMSEvent> => {
  const response = await api.post('/cms/events', eventData);
  return response.data;
};

export const updateCMSEvent = async (
  id: string,
  updateData: Partial<CreateEventRequest>
): Promise<CMSEvent> => {
  const response = await api.put(`/cms/events/${id}`, updateData);
  return response.data;
};

export const deleteCMSEvent = async (id: string): Promise<void> => {
  await api.delete(`/cms/events/${id}`);
};

// CMS News Articles API
export const getCMSNewsArticles = async (
  page: number = 1,
  limit: number = 20,
  status?: string,
  category?: string
): Promise<{
  content: CMSNewsArticle[];
  totalCount: number;
  pagination: any;
}> => {
  const response = await api.get('/cms/news', {
    params: { page, limit, status, category },
  });
  return response.data;
};

export const createCMSNewsArticle = async (
  articleData: CreateNewsArticleRequest
): Promise<CMSNewsArticle> => {
  const response = await api.post('/cms/news', articleData);
  return response.data;
};

export const updateCMSNewsArticle = async (
  id: string,
  updateData: Partial<CreateNewsArticleRequest>
): Promise<CMSNewsArticle> => {
  const response = await api.put(`/cms/news/${id}`, updateData);
  return response.data;
};

export const deleteCMSNewsArticle = async (id: string): Promise<void> => {
  await api.delete(`/cms/news/${id}`);
};

// CMS System Messages API
export const getCMSSystemMessages = async (
  page: number = 1,
  limit: number = 20,
  active?: boolean
): Promise<{
  content: CMSSystemMessage[];
  totalCount: number;
  pagination: any;
}> => {
  const response = await api.get('/cms/messages', {
    params: { page, limit, active },
  });
  return response.data;
};

export const createCMSSystemMessage = async (
  messageData: CreateSystemMessageRequest
): Promise<CMSSystemMessage> => {
  const response = await api.post('/cms/messages', messageData);
  return response.data;
};

export const updateCMSSystemMessage = async (
  id: string,
  updateData: Partial<CreateSystemMessageRequest>
): Promise<CMSSystemMessage> => {
  const response = await api.put(`/cms/messages/${id}`, updateData);
  return response.data;
};

export const deleteCMSSystemMessage = async (id: string): Promise<void> => {
  await api.delete(`/cms/messages/${id}`);
};

// CMS Statistics API
export const getCMSStats = async (): Promise<CMSStats> => {
  const response = await api.get('/cms/stats');
  return response.data;
};

// CMS Preview API
export const previewCMSEvent = async (
  eventData: CreateEventRequest
): Promise<any> => {
  const response = await api.post('/cms/preview/event', eventData);
  return response.data;
};

export const previewCMSNewsArticle = async (
  articleData: CreateNewsArticleRequest
): Promise<any> => {
  const response = await api.post('/cms/preview/news', articleData);
  return response.data;
};

export const previewCMSSystemMessage = async (
  messageData: CreateSystemMessageRequest
): Promise<any> => {
  const response = await api.post('/cms/preview/message', messageData);
  return response.data;
};

// CMS Bulk Operations API
export const bulkPublishContent = async (
  contentIds: string[]
): Promise<{
  results: Array<{
    id: string;
    success: boolean;
    result?: any;
    error?: string;
  }>;
}> => {
  const response = await api.post('/cms/bulk-publish', { contentIds });
  return response.data;
};

export const bulkArchiveContent = async (
  contentIds: string[]
): Promise<{
  results: Array<{
    id: string;
    success: boolean;
    result?: any;
    error?: string;
  }>;
}> => {
  const response = await api.post('/cms/bulk-archive', { contentIds });
  return response.data;
};
