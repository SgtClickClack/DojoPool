import { MarketplaceItem } from '../types/marketplace';

interface CartItem extends MarketplaceItem {
    quantity: number;
}

interface InventoryItem extends MarketplaceItem {
    quantity: number;
    purchaseDate: string;
}

class MarketplaceService {
    private cart: Map<string, CartItem> = new Map();
    private cartUpdateCallbacks: Set<(count: number) => void> = new Set();

    // Cart Management
    public addToCart(item: MarketplaceItem, quantity: number = 1): void {
        const existingItem = this.cart.get(item.id);
        if (existingItem) {
            existingItem.quantity += quantity;
            this.cart.set(item.id, existingItem);
        } else {
            this.cart.set(item.id, { ...item, quantity });
        }
        this.notifyCartUpdates();
    }

    public removeFromCart(itemId: string): void {
        this.cart.delete(itemId);
        this.notifyCartUpdates();
    }

    public updateCartItemQuantity(itemId: string, quantity: number): void {
        const item = this.cart.get(itemId);
        if (item) {
            item.quantity = quantity;
            this.cart.set(itemId, item);
            this.notifyCartUpdates();
        }
    }

    public getCartItems(): CartItem[] {
        return Array.from(this.cart.values());
    }

    public getCartTotal(): number {
        return Array.from(this.cart.values()).reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );
    }

    public getCartCount(): number {
        return Array.from(this.cart.values()).reduce(
            (count, item) => count + item.quantity,
            0
        );
    }

    public clearCart(): void {
        this.cart.clear();
        this.notifyCartUpdates();
    }

    // Cart Update Subscriptions
    public subscribeToCartUpdates(callback: (count: number) => void): () => void {
        this.cartUpdateCallbacks.add(callback);
        callback(this.getCartCount());

        return () => {
            this.cartUpdateCallbacks.delete(callback);
        };
    }

    private notifyCartUpdates(): void {
        const count = this.getCartCount();
        this.cartUpdateCallbacks.forEach(callback => callback(count));
    }

    // API Calls
    public async fetchItems(
        category?: string,
        sortBy?: string,
        search?: string
    ): Promise<MarketplaceItem[]> {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (sortBy) params.append('sortBy', sortBy);
        if (search) params.append('search', search);

        const response = await fetch(`/api/marketplace/items?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch marketplace items');
        }

        return response.json();
    }

    public async fetchInventory(): Promise<InventoryItem[]> {
        const response = await fetch('/api/marketplace/inventory');
        if (!response.ok) {
            throw new Error('Failed to fetch inventory');
        }

        return response.json();
    }

    public async fetchTransactions(): Promise<any[]> {
        const response = await fetch('/api/marketplace/transactions');
        if (!response.ok) {
            throw new Error('Failed to fetch transactions');
        }

        return response.json();
    }

    public async purchaseItems(): Promise<void> {
        const items = this.getCartItems();
        const response = await fetch('/api/marketplace/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ items }),
        });

        if (!response.ok) {
            throw new Error('Failed to complete purchase');
        }

        this.clearCart();
    }

    public async getWalletBalance(): Promise<number> {
        const response = await fetch('/api/marketplace/wallet');
        if (!response.ok) {
            throw new Error('Failed to fetch wallet balance');
        }

        const { balance } = await response.json();
        return balance;
    }
}

export const marketplaceService = new MarketplaceService();
export default marketplaceService; 