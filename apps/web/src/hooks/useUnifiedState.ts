/**
 * Unified State Management Hook
 *
 * Consolidates all application state management into a single, optimized system.
 * Replaces multiple React Contexts with a unified approach using Zustand for
 * better performance and simpler state management.
 *
 * Features:
 * - Global application state
 * - Optimized re-renders with selective subscriptions
 * - Type-safe state management
 * - Real-time WebSocket integration
 * - Persistent state where needed
 * - Error boundaries and recovery
 * - Performance monitoring
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { websocketService } from '@/services/WebSocketService';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/APIService';
import {
  getPlayerInventory,
  getPlayerLoadout,
  equipItem,
  unequipItem,
} from '@/services/APIService';
import { z } from 'zod';
import { type EquipmentSlot } from '@/types/inventory';

// Validation schemas
const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  isRead: z.boolean(),
  createdAt: z.string(),
});

const inventoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  rarity: z.string(),
  quantity: z.number(),
  equipped: z.boolean(),
});

// Types
interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  role: 'USER' | 'ADMIN';
  clanId?: string;
  clanRole?: 'member' | 'leader';
  avatarUrl?: string;
  isAdmin: boolean;
}

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  lastActivity: string;
}

interface CosmeticItem {
  id: string;
  name: string;
  description?: string;
  type: string;
  rarity: string;
  imageUrl: string;
  key: string;
  isDefault: boolean;
  isTradable: boolean;
  icon: string;
  previewImage: string;
  equipmentSlot?: string;
  createdAt: string;
  updatedAt: string;
}

interface PlayerInventoryItem {
  id: string;
  userId: string;
  itemId: string;
  item: CosmeticItem;
  acquiredAt: string;
  source: string;
  isEquipped: boolean;
  equippedAt?: string;
}

interface PlayerLoadout {
  id: string;
  userId: string;
  primaryCueId?: string;
  primaryCue?: CosmeticItem;
  ballSetId?: string;
  ballSet?: CosmeticItem;
  tableThemeId?: string;
  tableTheme?: CosmeticItem;
  avatarFrameId?: string;
  avatarFrame?: CosmeticItem;
  profileBadgeId?: string;
  profileBadge?: CosmeticItem;
  titleId?: string;
  title?: CosmeticItem;
  emoteWheel1Id?: string;
  emoteWheel1?: CosmeticItem;
  emoteWheel2Id?: string;
  emoteWheel2?: CosmeticItem;
  emoteWheel3Id?: string;
  emoteWheel3?: CosmeticItem;
  emoteWheel4Id?: string;
  emoteWheel4?: CosmeticItem;
  emoteWheel5Id?: string;
  emoteWheel5?: CosmeticItem;
  emoteWheel6Id?: string;
  emoteWheel6?: CosmeticItem;
  createdAt: string;
  updatedAt: string;
}

// State interfaces
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  isLoading: boolean;
  error: string | null;
}

interface ChatState {
  conversations: Conversation[];
  unreadCount: number;
}

interface InventoryState {
  inventory: PlayerInventoryItem[];
  allItems: CosmeticItem[];
  loadout: PlayerLoadout | null;
  loading: boolean;
  equipping: string | null;
  error: string | null;
  searchQuery: string;
  selectedType: string;
  selectedRarity: string;
  showOwnedOnly: boolean;
}

interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;

  // Notification state
  notifications: NotificationState;

  // Chat state
  chat: ChatState;

  // Inventory state
  inventory: InventoryState;

  // UI state
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  loading: boolean;
  error: string | null;
}

// Actions interface
interface AppActions {
  // User actions
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;

  // Notification actions
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  clearNotificationError: () => void;

  // Chat actions
  updateConversation: (conversation: Conversation) => void;
  addMessage: (message: ChatMessage) => void;
  markConversationAsRead: (conversationId: string) => void;
  refreshConversations: () => void;

  // Inventory actions
  fetchInventoryData: () => Promise<void>;
  setInventoryFilters: (
    filters: Partial<
      Pick<
        InventoryState,
        'searchQuery' | 'selectedType' | 'selectedRarity' | 'showOwnedOnly'
      >
    >
  ) => void;
  equipItem: (itemId: string, equipmentSlot: string) => Promise<void>;
  unequipItem: (equipmentSlot: string) => Promise<void>;
  clearInventoryError: () => void;

  // UI actions
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // WebSocket actions
  initializeWebSocket: () => void;
  cleanupWebSocket: () => void;
}

// Store type
type AppStore = AppState & AppActions;

// Create the unified store
export const useAppStore = create<AppStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,

        notifications: {
          notifications: [],
          unreadCount: 0,
          totalCount: 0,
          isLoading: false,
          error: null,
        },

        chat: {
          conversations: [],
          unreadCount: 0,
        },

        inventory: {
          inventory: [],
          allItems: [],
          loadout: null,
          loading: false,
          equipping: null,
          error: null,
          searchQuery: '',
          selectedType: 'ALL',
          selectedRarity: 'ALL',
          showOwnedOnly: false,
        },

        sidebarOpen: false,
        theme: 'light',
        loading: false,
        error: null,

        // User actions
        setUser: (user) => set({ user, isAuthenticated: !!user }),
        setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

        // Notification actions
        fetchNotifications: async () => {
          const { user } = get();
          if (!user) return;

          set((state) => ({
            notifications: {
              ...state.notifications,
              isLoading: true,
              error: null,
            },
          }));

          try {
            const response = await getNotifications();

            // Validate response data
            const validatedNotifications = response.notifications.map(
              (notification) => notificationSchema.parse(notification)
            );

            set((state) => ({
              notifications: {
                ...state.notifications,
                notifications: validatedNotifications,
                unreadCount: response.unreadCount,
                totalCount: response.totalCount,
                isLoading: false,
              },
            }));
          } catch (error) {
            console.error('Failed to fetch notifications:', error);
            set((state) => ({
              notifications: {
                ...state.notifications,
                isLoading: false,
                error:
                  error instanceof Error
                    ? error.message
                    : 'Failed to fetch notifications',
              },
            }));
          }
        },

        markNotificationAsRead: async (notificationId) => {
          try {
            await markNotificationAsRead(notificationId);
            set((state) => ({
              notifications: {
                ...state.notifications,
                notifications: state.notifications.notifications.map((n) =>
                  n.id === notificationId ? { ...n, isRead: true } : n
                ),
                unreadCount: Math.max(0, state.notifications.unreadCount - 1),
              },
            }));
          } catch (error) {
            console.error('Error marking notification as read:', error);
          }
        },

        markAllNotificationsAsRead: async () => {
          try {
            await markAllNotificationsAsRead();
            set((state) => ({
              notifications: {
                ...state.notifications,
                notifications: state.notifications.notifications.map((n) => ({
                  ...n,
                  isRead: true,
                })),
                unreadCount: 0,
              },
            }));
          } catch (error) {
            console.error('Error marking all notifications as read:', error);
          }
        },

        addNotification: (notification) => {
          set((state) => ({
            notifications: {
              ...state.notifications,
              notifications: [
                notification,
                ...state.notifications.notifications,
              ],
              unreadCount: state.notifications.unreadCount + 1,
              totalCount: state.notifications.totalCount + 1,
            },
          }));
        },

        clearNotificationError: () => {
          set((state) => ({
            notifications: { ...state.notifications, error: null },
          }));
        },

        // Chat actions
        updateConversation: (conversation) => {
          set((state) => {
            const existingIndex = state.chat.conversations.findIndex(
              (conv) => conv.id === conversation.id
            );

            if (existingIndex >= 0) {
              const updated = [...state.chat.conversations];
              updated[existingIndex] = conversation;
              return { chat: { ...state.chat, conversations: updated } };
            } else {
              return {
                chat: {
                  ...state.chat,
                  conversations: [...state.chat.conversations, conversation],
                },
              };
            }
          });
        },

        addMessage: (message) => {
          set((state) => ({
            chat: {
              ...state.chat,
              conversations: state.chat.conversations.map((conv) => {
                if (
                  conv.participantId === message.senderId ||
                  conv.participantId === message.receiverId
                ) {
                  return {
                    ...conv,
                    lastMessage: message,
                    lastActivity: message.timestamp,
                    unreadCount:
                      conv.participantId === message.senderId
                        ? conv.unreadCount + 1
                        : conv.unreadCount,
                  };
                }
                return conv;
              }),
            },
          }));
        },

        markConversationAsRead: (conversationId) => {
          set((state) => ({
            chat: {
              ...state.chat,
              conversations: state.chat.conversations.map((conv) =>
                conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
              ),
            },
          }));
        },

        refreshConversations: () => {
          // Implementation will be handled by the Messages page
        },

        // Inventory actions
        fetchInventoryData: async () => {
          const { user } = get();
          if (!user) return;

          set((state) => ({
            inventory: { ...state.inventory, loading: true, error: null },
          }));

          try {
            // Fetch all available items - TODO: Implement getCosmeticItems in APIService
            const allItemsResponse: any[] = []; // Placeholder until getCosmeticItems is implemented
            const transformedItems: CosmeticItem[] = allItemsResponse.map(
              (item) => ({
                ...item,
                key: item.id,
                isDefault: false,
                isTradable: true,
                icon: item.imageUrl,
                previewImage: item.imageUrl,
                equipmentSlot:
                  item.type === 'equipment' ? 'default' : undefined,
                createdAt: item.createdAt || new Date().toISOString(),
                updatedAt: item.updatedAt || new Date().toISOString(),
              })
            );

            // Fetch user's inventory
            const inventoryResponse = await getPlayerInventory(user.id);
            const transformedInventory: PlayerInventoryItem[] =
              inventoryResponse.items.map((item) => ({
                id: `${user.id}-${item.id}`,
                userId: user.id,
                itemId: item.id,
                item: {
                  ...item,
                  imageUrl: item.imageUrl || '',
                  key: item.id,
                  isDefault: false,
                  isTradable: true,
                  icon: item.imageUrl || '',
                  previewImage: item.imageUrl || '',
                  equipmentSlot:
                    item.type === 'equipment' ? 'default' : undefined,
                  createdAt: item.createdAt || new Date().toISOString(),
                  updatedAt: item.updatedAt || new Date().toISOString(),
                },
                acquiredAt: item.createdAt || new Date().toISOString(),
                source: 'unknown',
                isEquipped: item.equipped || false,
              }));

            // Fetch user's loadout
            const loadoutData = await getPlayerLoadout(user.id);

            set((state) => ({
              inventory: {
                ...state.inventory,
                inventory: transformedInventory,
                allItems: transformedItems,
                loadout: loadoutData as PlayerLoadout | null,
                loading: false,
              },
            }));
          } catch (error) {
            set((state) => ({
              inventory: {
                ...state.inventory,
                loading: false,
                error: 'Failed to load inventory data',
              },
            }));
          }
        },

        setInventoryFilters: (filters) => {
          set((state) => ({
            inventory: { ...state.inventory, ...filters },
          }));
        },

        equipItem: async (itemId, equipmentSlot) => {
          const { user } = get();
          if (!user) return;

          set((state) => ({
            inventory: { ...state.inventory, equipping: itemId },
          }));

          try {
            await equipItem({
              userId: user.id,
              itemId,
              equipmentSlot: equipmentSlot as EquipmentSlot,
            });
            // Refresh inventory data
            await get().fetchInventoryData();
          } catch (error) {
            set((state) => ({
              inventory: {
                ...state.inventory,
                error: 'Failed to equip item',
              },
            }));
          } finally {
            set((state) => ({
              inventory: { ...state.inventory, equipping: null },
            }));
          }
        },

        unequipItem: async (equipmentSlot) => {
          const { user } = get();
          if (!user) return;

          set((state) => ({
            inventory: { ...state.inventory, equipping: equipmentSlot },
          }));

          try {
            await unequipItem({
              userId: user.id,
              equipmentSlot: equipmentSlot as EquipmentSlot,
            });
            // Refresh inventory data
            await get().fetchInventoryData();
          } catch (error) {
            set((state) => ({
              inventory: {
                ...state.inventory,
                error: 'Failed to unequip item',
              },
            }));
          } finally {
            set((state) => ({
              inventory: { ...state.inventory, equipping: null },
            }));
          }
        },

        clearInventoryError: () => {
          set((state) => ({
            inventory: { ...state.inventory, error: null },
          }));
        },

        // UI actions
        setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
        setTheme: (theme) => set({ theme }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),

        // WebSocket actions
        initializeWebSocket: () => {
          const { user } = get();
          if (!user) return;

          // Subscribe to notification events
          websocketService.subscribe('new_notification', (event: any) => {
            if (event.type === 'new_notification' && event.data) {
              get().addNotification(event.data);
            }
          });

          // Subscribe to chat events
          websocketService.subscribe('new_dm', (data: any) => {
            if (data && typeof data === 'object' && 'id' in data) {
              get().addMessage(data as ChatMessage);
            }
          });
        },

        cleanupWebSocket: () => {
          // Note: unsubscribe requires the callback function, but we don't have access to it here
          // This is a limitation of the current implementation
          // TODO: Store callback references to properly unsubscribe
        },
      }),
      {
        name: 'dojo-pool-app-state',
        partialize: (state) => ({
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
        }),
      }
    )
  )
);

// Selector hooks for optimized re-renders
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () =>
  useAppStore((state) => state.isAuthenticated);
export const useNotifications = () =>
  useAppStore((state) => state.notifications);
export const useChat = () => useAppStore((state) => state.chat);
export const useInventory = () => useAppStore((state) => state.inventory);
export const useUI = () =>
  useAppStore((state) => ({
    sidebarOpen: state.sidebarOpen,
    theme: state.theme,
    loading: state.loading,
    error: state.error,
  }));

// Action hooks
export const useAppActions = () =>
  useAppStore((state) => ({
    setUser: state.setUser,
    setAuthenticated: state.setAuthenticated,
    fetchNotifications: state.fetchNotifications,
    markNotificationAsRead: state.markNotificationAsRead,
    markAllNotificationsAsRead: state.markAllNotificationsAsRead,
    addNotification: state.addNotification,
    clearNotificationError: state.clearNotificationError,
    updateConversation: state.updateConversation,
    addMessage: state.addMessage,
    markConversationAsRead: state.markConversationAsRead,
    refreshConversations: state.refreshConversations,
    fetchInventoryData: state.fetchInventoryData,
    setInventoryFilters: state.setInventoryFilters,
    equipItem: state.equipItem,
    unequipItem: state.unequipItem,
    clearInventoryError: state.clearInventoryError,
    setSidebarOpen: state.setSidebarOpen,
    setTheme: state.setTheme,
    setLoading: state.setLoading,
    setError: state.setError,
    clearError: state.clearError,
    initializeWebSocket: state.initializeWebSocket,
    cleanupWebSocket: state.cleanupWebSocket,
  }));

// Main hook that integrates with useAuth
export const useUnifiedState = () => {
  const { user, isAdmin } = useAuth();
  const setUser = useAppStore((state) => state.setUser);
  const setAuthenticated = useAppStore((state) => state.setAuthenticated);
  const initializeWebSocket = useAppStore((state) => state.initializeWebSocket);
  const cleanupWebSocket = useAppStore((state) => state.cleanupWebSocket);

  // Sync auth state with unified store
  useEffect(() => {
    if (user) {
      setUser({ ...user, isAdmin });
      setAuthenticated(true);
      initializeWebSocket();
    } else {
      setUser(null);
      setAuthenticated(false);
      cleanupWebSocket();
    }
  }, [
    user,
    isAdmin,
    setUser,
    setAuthenticated,
    initializeWebSocket,
    cleanupWebSocket,
  ]);

  return {
    user: useUser(),
    isAuthenticated: useIsAuthenticated(),
    notifications: useNotifications(),
    chat: useChat(),
    inventory: useInventory(),
    ui: useUI(),
    actions: useAppActions(),
  };
};
