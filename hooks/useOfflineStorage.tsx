/** @jsxImportSource react */
import { useState, useEffect, useCallback } from 'react';

type OfflineData<T> = {
  data: T;
  timestamp: number;
  expiresAt: number;
};

type StorageOptions = {
  expirationMinutes?: number;
  syncOnReconnect?: boolean;
};

const DEFAULT_OPTIONS = {
  expirationMinutes: 60, // 1 hour
  syncOnReconnect: true,
};

/**
 * Hook for managing offline data storage and synchronization
 */
export const useOfflineStorage = <T,>(
  key: string,
  initialData: T,
  options: StorageOptions = {}
) => {
  const [data, setData] = useState<T>(initialData);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<{ action: string; data: any }[]>([]);

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  // Load data from localStorage on initial render
  useEffect(() => {
    const loadStoredData = () => {
      try {
        const storedItem = localStorage.getItem(`offlineData:${key}`);
        if (storedItem) {
          const parsed = JSON.parse(storedItem) as OfflineData<T>;
          
          // Check if data is expired
          if (parsed.expiresAt > Date.now()) {
            setData(parsed.data);
            setLastUpdated(parsed.timestamp);
          } else {
            // Data is expired, remove it
            localStorage.removeItem(`offlineData:${key}`);
            setData(initialData);
          }
        }

        // Load pending actions
        const storedActions = localStorage.getItem(`pendingActions:${key}`);
        if (storedActions) {
          setPendingActions(JSON.parse(storedActions));
        }
      } catch (error) {
        console.error('Error loading offline data:', error);
        setData(initialData);
      }
    };

    loadStoredData();
  }, [key, initialData]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnlineStatus = () => {
      const isCurrentlyOnline = navigator.onLine;
      setIsOnline(isCurrentlyOnline);
      
      // If we're reconnecting and there are pending actions, try to sync
      if (isCurrentlyOnline && !isOnline && pendingActions.length > 0 && mergedOptions.syncOnReconnect) {
        syncPendingActions();
      }
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [isOnline, pendingActions, mergedOptions.syncOnReconnect]);

  // Save data to localStorage
  const saveData = useCallback((newData: T) => {
    const timestamp = Date.now();
    const expiresAt = timestamp + (mergedOptions.expirationMinutes || 60) * 60 * 1000;
    
    try {
      const offlineData: OfflineData<T> = {
        data: newData,
        timestamp,
        expiresAt,
      };
      
      localStorage.setItem(`offlineData:${key}`, JSON.stringify(offlineData));
      setData(newData);
      setLastUpdated(timestamp);
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }, [key, mergedOptions.expirationMinutes]);

  // Queue an action to be performed when online
  const queueAction = useCallback((action: string, actionData: any) => {
    const newPendingActions = [...pendingActions, { action, data: actionData }];
    setPendingActions(newPendingActions);
    localStorage.setItem(`pendingActions:${key}`, JSON.stringify(newPendingActions));
    
    // If we're online, try to sync immediately
    if (isOnline) {
      syncPendingActions();
    }
  }, [pendingActions, key, isOnline]);

  // Sync pending actions with the server
  const syncPendingActions = useCallback(async () => {
    if (pendingActions.length === 0 || !isOnline) return;
    
    setIsLoading(true);
    
    try {
      // Process actions in order
      const actionsToProcess = [...pendingActions];
      const completedActions = [];
      
      for (const action of actionsToProcess) {
        try {
          // Here you would implement the actual API call logic
          // For example:
          // if (action.action === 'create') await api.create(action.data);
          // else if (action.action === 'update') await api.update(action.data);
          // etc.
          
          console.log(`Processing action: ${action.action}`, action.data);
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 300));
          
          completedActions.push(action);
        } catch (error) {
          console.error(`Error processing action ${action.action}:`, error);
          break; // Stop processing if an action fails
        }
      }
      
      // Remove completed actions from pending list
      if (completedActions.length > 0) {
        const remainingActions = pendingActions.filter(
          action => !completedActions.includes(action)
        );
        setPendingActions(remainingActions);
        localStorage.setItem(`pendingActions:${key}`, JSON.stringify(remainingActions));
      }
    } catch (error) {
      console.error('Error syncing pending actions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pendingActions, isOnline, key]);

  // Manually trigger sync
  const sync = useCallback(() => {
    if (isOnline) {
      syncPendingActions();
    }
  }, [isOnline, syncPendingActions]);

  return {
    data,
    lastUpdated,
    isLoading,
    isOnline,
    pendingActions: pendingActions.length,
    saveData,
    queueAction,
    sync,
  };
};

export default useOfflineStorage;