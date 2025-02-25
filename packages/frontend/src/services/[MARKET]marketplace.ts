import { CartItem, InventoryItem, MarketplaceItem, Transaction } from '../types/marketplace';

const mockItems: MarketplaceItem[] = [
  {
    id: '1',
    name: 'Test Power-up',
    description: 'A test power-up item',
    price: 100,
    image: 'test.jpg',
    category: 'power-ups',
    rarity: 'common',
    stock: 10,
    effects: [{ type: 'boost', value: 1.5 }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Test Avatar',
    description: 'A test avatar item',
    price: 200,
    image: 'avatar.jpg',
    category: 'avatars',
    rarity: 'rare',
    stock: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class MarketplaceService {
  private cart: CartItem[] = [];
  private walletBalance: number = 1000;

  async fetchItems(filters?: {
    category?: string;
    search?: string;
    sortBy?: string;
  }): Promise<MarketplaceItem[]> {
    let filteredItems = [...mockItems];

    if (filters?.category) {
      filteredItems = filteredItems.filter(item => item.category === filters.category);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredItems = filteredItems.filter(
        item =>
          item.name.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'price-asc':
          filteredItems.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          filteredItems.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          filteredItems.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        case 'popular':
          // Mock popularity by using stock level (lower stock = more popular)
          filteredItems.sort((a, b) => a.stock - b.stock);
          break;
      }
    }

    return Promise.resolve(filteredItems);
  }

  async getWalletBalance(): Promise<number> {
    return this.walletBalance;
  }

  getCartCount(): number {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  getCartItems(): CartItem[] {
    return this.cart;
  }

  getCartTotal(): number {
    return this.cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  addToCart(item: MarketplaceItem, quantity: number): void {
    const existingItem = this.cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity <= 0) {
        this.cart = this.cart.filter(cartItem => cartItem.id !== item.id);
      } else {
        existingItem.quantity = newQuantity;
      }
    } else if (quantity > 0) {
      this.cart.push({ ...item, quantity });
    }
  }

  clearCart(): void {
    this.cart = [];
  }

  async purchaseItems(): Promise<void> {
    const total = this.getCartTotal();
    if (total > this.walletBalance) {
      throw new Error('Insufficient funds');
    }
    this.walletBalance -= total;
    this.clearCart();
  }

  async fetchInventory(): Promise<InventoryItem[]> {
    return Promise.resolve([
      {
        ...mockItems[0],
        quantity: 2,
        purchaseDate: new Date().toISOString(),
      },
    ]);
  }

  async fetchTransactions(): Promise<Transaction[]> {
    return Promise.resolve([
      {
        id: '1',
        items: [{ ...mockItems[0], quantity: 1, priceAtPurchase: 100 }],
        total: 100,
        timestamp: new Date().toISOString(),
        status: 'completed',
      },
    ]);
  }
}

export const marketplaceService = new MarketplaceService();
