export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'nft' | 'item' | 'currency';
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  image?: string;
  quantity?: number;
  stock?: number;
}

export interface CartItem {
  item: MarketplaceItem;
  quantity: number;
}

export interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
  total: number;
  timestamp: string;
  type: 'purchase' | 'sale';
  status: 'completed' | 'pending' | 'failed';
  items: {
    name: string;
    quantity: number;
    priceAtPurchase: number;
    image?: string;
  }[];
}

class MarketplaceService {
  private cart: CartItem[] = [];
  private inventory: MarketplaceItem[] = [];
  private transactions: Transaction[] = [];

  // Cart management
  getCartItems(): CartItem[] {
    return [...this.cart];
  }

  getCartCount(): number {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  getCartTotal(): number {
    return this.cart.reduce(
      (total, item) => total + item.item.price * item.quantity,
      0
    );
  }

  addToCart(item: MarketplaceItem, quantity: number): void {
    const existingItem = this.cart.find(
      (cartItem) => cartItem.item.id === item.id
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      if (existingItem.quantity <= 0) {
        this.cart = this.cart.filter(
          (cartItem) => cartItem.item.id !== item.id
        );
      }
    } else if (quantity > 0) {
      this.cart.push({ item, quantity });
    }
  }

  removeFromCart(itemId: string): void {
    this.cart = this.cart.filter((cartItem) => cartItem.item.id !== itemId);
  }

  clearCart(): void {
    this.cart = [];
  }

  // Inventory management
  async fetchInventory(): Promise<MarketplaceItem[]> {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/marketplace/inventory');
      if (response.ok) {
        this.inventory = await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
    return this.inventory;
  }

  getInventory(): MarketplaceItem[] {
    return [...this.inventory];
  }

  // Item management
  async fetchItems(filters?: any): Promise<MarketplaceItem[]> {
    try {
      // TODO: Replace with actual API call
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`/api/marketplace/items?${queryParams}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
    return [];
  }

  // Transaction management
  async fetchTransactions(): Promise<Transaction[]> {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/marketplace/transactions');
      if (response.ok) {
        this.transactions = await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
    return this.transactions;
  }

  // Wallet management
  async getWalletBalance(): Promise<number> {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/wallet/balance');
      if (response.ok) {
        const data = await response.json();
        return data.balance || 0;
      }
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
    }
    return 0;
  }

  // Purchase functionality
  async purchaseItems(): Promise<boolean> {
    try {
      if (this.cart.length === 0) {
        throw new Error('Cart is empty');
      }

      const cartTotal = this.getCartTotal();
      const walletBalance = await this.getWalletBalance();

      if (walletBalance < cartTotal) {
        throw new Error('Insufficient funds');
      }

      // TODO: Replace with actual API call
      const response = await fetch('/api/marketplace/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: this.cart.map((item) => ({
            itemId: item.item.id,
            quantity: item.quantity,
            price: item.item.price,
          })),
          total: cartTotal,
        }),
      });

      if (response.ok) {
        // Clear cart on successful purchase
        this.clearCart();
        return true;
      } else {
        throw new Error('Purchase failed');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  // Search functionality
  async searchItems(query: string, filters?: any): Promise<MarketplaceItem[]> {
    try {
      const searchParams = new URLSearchParams({
        q: query,
        ...filters,
      });

      const response = await fetch(`/api/marketplace/search?${searchParams}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
    return [];
  }
}

// Export singleton instance
export const marketplaceService = new MarketplaceService();
