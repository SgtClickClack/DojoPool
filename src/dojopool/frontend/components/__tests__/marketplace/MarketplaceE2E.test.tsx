import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { MarketplaceLayout } from '../../marketplace/MarketplaceLayout';
import { marketplaceService } from '../../../services/marketplace';

// Mock the marketplace service
jest.mock('../../../services/marketplace');

describe('Marketplace E2E Tests', () => {
  const mockItems = [
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

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup marketplace service mocks
    (marketplaceService.fetchItems as jest.Mock).mockResolvedValue(mockItems);
    (marketplaceService.getWalletBalance as jest.Mock).mockResolvedValue(1000);
    (marketplaceService.getCartCount as jest.Mock).mockReturnValue(0);
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  test('displays marketplace items and allows filtering', async () => {
    renderWithRouter(<MarketplaceLayout />);

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Test Power-up')).toBeInTheDocument();
      expect(screen.getByText('Test Avatar')).toBeInTheDocument();
    });

    // Test category filter
    const categorySelect = screen.getByRole('combobox', { name: /category/i });
    fireEvent.change(categorySelect, { target: { value: 'power-ups' } });

    await waitFor(() => {
      expect(marketplaceService.fetchItems).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'power-ups' })
      );
    });

    // Test search
    const searchInput = screen.getByPlaceholderText(/search items/i);
    await userEvent.type(searchInput, 'power');

    await waitFor(() => {
      expect(marketplaceService.fetchItems).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'power' })
      );
    });

    // Test sort
    const sortSelect = screen.getByRole('combobox', { name: /sort/i });
    fireEvent.change(sortSelect, { target: { value: 'price-asc' } });

    await waitFor(() => {
      expect(marketplaceService.fetchItems).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'price-asc' })
      );
    });
  });

  test('handles shopping cart operations', async () => {
    renderWithRouter(<MarketplaceLayout />);

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Test Power-up')).toBeInTheDocument();
    });

    // Add item to cart
    const addToCartButton = screen.getAllByRole('button', {
      name: /add to cart/i,
    })[0];
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(marketplaceService.addToCart).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1' }),
        1
      );
    });

    // Update cart count
    (marketplaceService.getCartCount as jest.Mock).mockReturnValue(1);
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // View cart
    const cartButton = screen.getByText(/cart/i);
    fireEvent.click(cartButton);

    // Verify navigation to cart page
    expect(window.location.pathname).toBe('/marketplace/cart');
  });

  test('completes purchase flow', async () => {
    // Mock cart items
    (marketplaceService.getCartItems as jest.Mock).mockReturnValue([
      { ...mockItems[0], quantity: 1 },
    ]);
    (marketplaceService.getCartTotal as jest.Mock).mockReturnValue(100);

    renderWithRouter(<MarketplaceLayout />);

    // Navigate to cart
    const cartButton = screen.getByText(/cart/i);
    fireEvent.click(cartButton);

    // Wait for cart page to load
    await waitFor(() => {
      expect(screen.getByText('Test Power-up')).toBeInTheDocument();
      expect(screen.getByText('100 DP')).toBeInTheDocument();
    });

    // Complete purchase
    const purchaseButton = screen.getByRole('button', { name: /purchase/i });
    fireEvent.click(purchaseButton);

    await waitFor(() => {
      expect(marketplaceService.purchaseItems).toHaveBeenCalled();
    });

    // Verify cart is cleared
    expect(marketplaceService.clearCart).toHaveBeenCalled();
  });

  test('displays user inventory', async () => {
    // Mock inventory items
    const inventoryItems = [
      {
        ...mockItems[0],
        quantity: 2,
        purchaseDate: new Date().toISOString(),
      },
    ];
    (marketplaceService.fetchInventory as jest.Mock).mockResolvedValue(inventoryItems);

    renderWithRouter(<MarketplaceLayout />);

    // Navigate to inventory
    const inventoryButton = screen.getByText(/view full inventory/i);
    fireEvent.click(inventoryButton);

    // Verify inventory items are displayed
    await waitFor(() => {
      expect(screen.getByText('Test Power-up')).toBeInTheDocument();
      expect(screen.getByText('Quantity: 2')).toBeInTheDocument();
    });
  });

  test('displays transaction history', async () => {
    // Mock transactions
    const transactions = [
      {
        id: '1',
        items: [{ ...mockItems[0], quantity: 1, priceAtPurchase: 100 }],
        total: 100,
        timestamp: new Date().toISOString(),
        status: 'completed',
      },
    ];
    (marketplaceService.fetchTransactions as jest.Mock).mockResolvedValue(transactions);

    renderWithRouter(<MarketplaceLayout />);

    // Navigate to transaction history
    const historyButton = screen.getByText(/transaction history/i);
    fireEvent.click(historyButton);

    // Verify transactions are displayed
    await waitFor(() => {
      expect(screen.getByText('Test Power-up')).toBeInTheDocument();
      expect(screen.getByText('100 DP')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
    });
  });

  test('handles error states', async () => {
    // Mock error responses
    (marketplaceService.fetchItems as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch items')
    );

    renderWithRouter(<MarketplaceLayout />);

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/error loading items/i)).toBeInTheDocument();
    });

    // Mock insufficient funds error
    (marketplaceService.purchaseItems as jest.Mock).mockRejectedValue(
      new Error('Insufficient funds')
    );

    // Attempt purchase
    const purchaseButton = screen.getByRole('button', { name: /purchase/i });
    fireEvent.click(purchaseButton);

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/insufficient funds/i)).toBeInTheDocument();
    });
  });
});
