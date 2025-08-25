import { apiClient } from './apiClient';

export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  stock: number;
  type: 'avatar' | 'cue' | 'table' | 'emote' | 'title';
}

export interface UserInventoryItem {
  id: string;
  itemId: string;
  name: string;
  description: string;
  image: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  type: 'avatar' | 'cue' | 'table' | 'emote' | 'title';
  acquiredAt: string;
  equipped: boolean;
}

export interface UserBalance {
  dojoCoins: number;
  lastUpdated: string;
}

class MarketplaceService {
  async getMarketplaceItems(): Promise<MarketplaceItem[]> {
    try {
      const response = await apiClient.get('/marketplace/items');
      return response.data;
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
      // Return mock data for development
      return this.getMockMarketplaceItems();
    }
  }

  async buyMarketplaceItem(itemId: string): Promise<{ success: boolean; message: string; newBalance?: number }> {
    try {
      const response = await apiClient.post(`/marketplace/items/${itemId}/buy`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to purchase item';
      throw new Error(message);
    }
  }

  async getUserInventory(): Promise<UserInventoryItem[]> {
    try {
      const response = await apiClient.get('/user/inventory');
      return response.data;
    } catch (error) {
      console.error('Error fetching user inventory:', error);
      // Return mock data for development
      return this.getMockInventoryItems();
    }
  }

  async getUserBalance(): Promise<UserBalance> {
    try {
      const response = await apiClient.get('/user/balance');
      return response.data;
    } catch (error) {
      console.error('Error fetching user balance:', error);
      // Return mock data for development
      return { dojoCoins: 1500, lastUpdated: new Date().toISOString() };
    }
  }

  private getMockMarketplaceItems(): MarketplaceItem[] {
    return [
      {
        id: '1',
        name: 'Golden Dragon Cue',
        description: 'A legendary cue with golden dragon engravings',
        price: 500,
        image: '/images/cues/golden-dragon-cue.jpg',
        category: 'cues',
        rarity: 'legendary',
        stock: 3,
        type: 'cue'
      },
      {
        id: '2',
        name: 'Cyberpunk Avatar',
        description: 'Futuristic neon-styled avatar skin',
        price: 200,
        image: '/images/avatars/cyberpunk-avatar.jpg',
        category: 'avatars',
        rarity: 'epic',
        stock: 10,
        type: 'avatar'
      },
      {
        id: '3',
        name: 'Victory Emote',
        description: 'Celebratory emote for winning matches',
        price: 75,
        image: '/images/emotes/victory-emote.jpg',
        category: 'emotes',
        rarity: 'rare',
        stock: 25,
        type: 'emote'
      },
      {
        id: '4',
        name: 'Jade Pool Table',
        description: 'Elegant jade-themed pool table skin',
        price: 300,
        image: '/images/tables/jade-table.jpg',
        category: 'tables',
        rarity: 'epic',
        stock: 5,
        type: 'table'
      },
      {
        id: '5',
        name: 'Champion Title',
        description: 'Exclusive title for tournament winners',
        price: 1000,
        image: '/images/titles/champion-title.jpg',
        category: 'titles',
        rarity: 'legendary',
        stock: 1,
        type: 'title'
      },
      {
        id: '6',
        name: 'Stealth Cue',
        description: 'Sleek black cue with stealth design',
        price: 150,
        image: '/images/cues/stealth-cue.jpg',
        category: 'cues',
        rarity: 'rare',
        stock: 15,
        type: 'cue'
      }
    ];
  }

  private getMockInventoryItems(): UserInventoryItem[] {
    return [
      {
        id: 'inv1',
        itemId: '1',
        name: 'Golden Dragon Cue',
        description: 'A legendary cue with golden dragon engravings',
        image: '/images/cues/golden-dragon-cue.jpg',
        category: 'cues',
        rarity: 'legendary',
        type: 'cue',
        acquiredAt: '2024-01-15T10:30:00Z',
        equipped: true
      },
      {
        id: 'inv2',
        itemId: '2',
        name: 'Cyberpunk Avatar',
        description: 'Futuristic neon-styled avatar skin',
        image: '/images/avatars/cyberpunk-avatar.jpg',
        category: 'avatars',
        rarity: 'epic',
        type: 'avatar',
        acquiredAt: '2024-01-10T14:20:00Z',
        equipped: false
      }
    ];
  }
}

export const marketplaceService = new MarketplaceService();
export default marketplaceService;
