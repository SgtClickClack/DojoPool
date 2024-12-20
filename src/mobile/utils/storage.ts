import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class StorageManager {
  private static instance: StorageManager;

  private constructor() {}

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  async setItem<T>(key: string, value: T, expiresIn: number = 3600): Promise<void> {
    try {
      const item: CacheItem<T> = {
        data: value,
        timestamp: Date.now(),
        expiresIn: expiresIn * 1000, // Convert to milliseconds
      };
      await AsyncStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Error setting item in storage:', error);
      throw error;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (!value) return null;

      const item: CacheItem<T> = JSON.parse(value);
      const now = Date.now();
      const expirationTime = item.timestamp + item.expiresIn;

      if (now > expirationTime) {
        await this.removeItem(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from storage:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys from storage:', error);
      return [];
    }
  }

  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    try {
      return await AsyncStorage.multiGet(keys);
    } catch (error) {
      console.error('Error getting multiple items from storage:', error);
      return [];
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error removing multiple items from storage:', error);
      throw error;
    }
  }
}

export default StorageManager; 