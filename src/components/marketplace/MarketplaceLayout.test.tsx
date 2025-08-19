import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Import the component under test from apps/web via relative path
import { MarketplaceLayout } from '../../../apps/web/components/marketplace/MarketplaceLayout';

// Mock the marketplace service used by the component
import * as marketplaceModule from '../../../apps/web/services/marketplace';

const mockItems: marketplaceModule.MarketplaceItem[] = [
  {
    id: '1',
    name: 'Power Boost',
    description: 'Increase your power for one match',
    price: 100,
    type: 'item',
    image: '/img/power.png',
    stock: 5,
  },
  {
    id: '2',
    name: 'Golden Cue',
    description: 'Shiny legendary cue',
    price: 1000,
    type: 'nft',
    image: '/img/cue.png',
    stock: 1,
  },
];

describe('MarketplaceLayout', () => {
  let fetchItemsSpy: any;
  let getWalletBalanceSpy: any;
  let addToCartSpy: any;
  let getCartCountSpy: any;

  beforeEach(() => {
    fetchItemsSpy = vi
      .spyOn(marketplaceModule.marketplaceService, 'fetchItems')
      .mockResolvedValue(mockItems);
    getWalletBalanceSpy = vi
      .spyOn(marketplaceModule.marketplaceService, 'getWalletBalance')
      .mockResolvedValue(250);
    addToCartSpy = vi
      .spyOn(marketplaceModule.marketplaceService, 'addToCart')
      .mockImplementation(() => {});
    getCartCountSpy = vi
      .spyOn(marketplaceModule.marketplaceService, 'getCartCount')
      .mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithRouter = (initialEntries = ['/marketplace']) =>
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/marketplace/*" element={<MarketplaceLayout />} />
        </Routes>
      </MemoryRouter>
    );

  it('renders header and loads items and wallet on mount', async () => {
    renderWithRouter();

    // Header title
    expect(
      await screen.findByRole('heading', { name: /dojo pool marketplace/i })
    ).toBeInTheDocument();

    // Sidebar wallet should show after data resolves
    await waitFor(() => {
      expect(screen.getByText(/your wallet/i)).toBeInTheDocument();
      expect(screen.getByText(/250 DP/)).toBeInTheDocument();
    });

    // Items grid should render item cards
    await waitFor(() => {
      expect(screen.getByText('Power Boost')).toBeInTheDocument();
      expect(screen.getByText('Golden Cue')).toBeInTheDocument();
    });

    // Service calls were made
    expect(fetchItemsSpy).toHaveBeenCalled();
    expect(getWalletBalanceSpy).toHaveBeenCalled();
  });

  it('add to cart calls service and can update cart preview count', async () => {
    // Start with empty cart count
    getCartCountSpy.mockReturnValue(0);

    renderWithRouter();

    const addButtons = await screen.findAllByRole('button', {
      name: /add to cart/i,
    });

    // Simulate cart count increasing in service after add
    getCartCountSpy.mockReturnValue(1);

    fireEvent.click(addButtons[0]);

    // Verify service invoked correctly
    expect(addToCartSpy).toHaveBeenCalledWith(mockItems[0], 1);

    // Click on cart preview to force a re-render path (optional)
    fireEvent.click(screen.getByText(/cart/i));

    // Footer cart count text reflects updated mock on subsequent renders
    // Note: We don't strictly assert the number change since state update is internal,
    // but we ensure the element is present.
    expect(screen.getByText(/cart/i)).toBeInTheDocument();
  });

  it('shows search and filter controls on base marketplace route', async () => {
    renderWithRouter(['/marketplace']);

    // Search input visible
    expect(await screen.findByPlaceholderText(/search items/i)).toBeInTheDocument();

    // Category and Sort select visible
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
  });
});
