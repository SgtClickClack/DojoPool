// Temporarily disabled - stub service for storage
class StorageService {
  async getItem(key: string): Promise<string | null> {
    console.log('Storage getItem temporarily disabled', { key });
    return null;
  }

  async setItem(key: string, value: string): Promise<void> {
    console.log('Storage setItem temporarily disabled', { key, value });
  }

  async removeItem(key: string): Promise<void> {
    console.log('Storage removeItem temporarily disabled', { key });
  }

  async clear(): Promise<void> {
    console.log('Storage clear temporarily disabled');
  }
}

export default new StorageService();
