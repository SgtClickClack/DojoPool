type CartItem = {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  stock: number;
  quantity: number;
};

class MarketplaceServiceStub {
  private _items: CartItem[] = [];
  private _walletBalance = 0;

  getCartItems(): CartItem[] {
    return this._items;
  }

  getCartTotal(): number {
    return this._items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  getCartCount(): number {
    return this._items.reduce((sum, item) => sum + item.quantity, 0);
  }

  addToCart(item: CartItem | any, deltaQuantity: number): void {
    const normalized: CartItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      image: item.image,
      price: item.price,
      stock: item.stock ?? 0,
      quantity: (item.quantity as number) ?? 0,
    };
    const existing = this._items.find((i) => i.id === normalized.id);
    if (existing) {
      existing.quantity = Math.max(
        0,
        Math.min(existing.stock, existing.quantity + deltaQuantity)
      );
      if (existing.quantity === 0) {
        this._items = this._items.filter((i) => i.id !== normalized.id);
      }
    } else if (deltaQuantity > 0) {
      this._items.push({
        ...normalized,
        quantity: Math.min(normalized.stock, deltaQuantity),
      });
    }
  }

  async purchaseItems(): Promise<void> {
    // no-op stub; clear cart
    this._items = [];
  }

  async fetchInventory(): Promise<any[]> {
    return [];
  }

  async fetchTransactions(): Promise<any[]> {
    return [];
  }

  async fetchItems(_filters: any): Promise<any[]> {
    return [];
  }

  async getWalletBalance(): Promise<number> {
    return this._walletBalance;
  }
}

export const marketplaceService = new MarketplaceServiceStub();
