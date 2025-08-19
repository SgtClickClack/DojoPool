import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ReactRouterDomActual from 'react-router-dom';
import ReactRouterActual from 'react-router';

// Mock react-router-dom to avoid cross-package React context issues (apps/web has its own node_modules)
vi.mock('react-router-dom', async () => {
  const React = await import('react');
  // Fallback no-op components and hooks
  return {
    __esModule: true,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/marketplace', search: '' }),
    Routes: ({ children }: any) => (
      <>{React.Children.map(children, (child: any) => child?.props?.element)}</>
    ),
    Route: ({ element }: any) => <>{element}</>,
    MemoryRouter: ({ children }: any) => <>{children}</>,
    Link: ({ children, to }: any) => <a href={typeof to === 'string' ? to : '#'}>{children}</a>,
    NavLink: ({ children, to }: any) => <a href={typeof to === 'string' ? to : '#'}>{children}</a>,
  };
});

// Also mock the module path as resolved within apps/web to ensure same hooks are overridden
vi.mock('../../../apps/web/node_modules/react-router-dom', async () => {
  const React = await import('react');
  return {
    __esModule: true,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/marketplace', search: '' }),
    Routes: ({ children }: any) => (
      <>{React.Children.map(children, (child: any) => child?.props?.element)}</>
    ),
    Route: ({ element }: any) => <>{element}</>,
    MemoryRouter: ({ children }: any) => <>{children}</>,
    Link: ({ children, to }: any) => <a href={typeof to === 'string' ? to : '#'}>{children}</a>,
    NavLink: ({ children, to }: any) => <a href={typeof to === 'string' ? to : '#'}>{children}</a>,
  };
});

// Importing types after mock ensures typed usage
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Import the components under test from apps/web via relative path
import { MarketplaceMain } from '../../../apps/web/components/marketplace/MarketplaceLayout';

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

  const renderMain = () =>
    render(
      <MemoryRouter>
        {/* Directly render MarketplaceMain to avoid nested router issues */}
        <MarketplaceMain onCartUpdate={() => {}} />
      </MemoryRouter>
    );

  it('loads items and shows wallet balance', async () => {
    renderMain();

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

  it('add to cart calls service', async () => {
    // Start with empty cart count
    getCartCountSpy.mockReturnValue(0);

    renderMain();

    const addButtons = await screen.findAllByRole('button', {
      name: /add to cart/i,
    });

    // Simulate cart count increasing in service after add
    getCartCountSpy.mockReturnValue(1);

    fireEvent.click(addButtons[0]);

    // Verify service invoked correctly
    expect(addToCartSpy).toHaveBeenCalledWith(mockItems[0], 1);
  });

  it('renders category navigation', async () => {
    renderMain();

    await screen.findByText(/categories/i);
    expect(screen.getAllByText(/power-ups/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/avatar items/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/accessories/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/special items/i).length).toBeGreaterThan(0);
  });
});
