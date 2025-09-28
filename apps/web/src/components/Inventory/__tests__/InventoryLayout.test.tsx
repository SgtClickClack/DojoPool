import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@/components/__tests__/test-utils';
import { InventoryLayout } from '@/components/Inventory/InventoryLayout';
import type { InventoryContextType } from '@/components/Inventory/InventoryDataProvider';

const { mockUseInventory } = vi.hoisted(() => ({
  mockUseInventory: vi.fn<[], InventoryContextType>(),
}));

vi.mock('@/components/Inventory/InventoryDataProvider', () => ({
  useInventory: mockUseInventory,
}));

vi.mock('@/components/Inventory/InventoryHeader', () => ({
  InventoryHeader: () => (
    <div data-testid="inventory-header">Inventory Header</div>
  ),
}));

vi.mock('@/components/Inventory/InventoryStats', () => ({
  InventoryStats: ({ totalItems }: { totalItems: number }) => (
    <div data-testid="inventory-stats">Total Items: {totalItems}</div>
  ),
}));

vi.mock('@/components/Inventory/InventoryFilters', () => ({
  InventoryFilters: () => <div data-testid="inventory-filters">Filters</div>,
}));

vi.mock('@/components/Inventory/InventoryTabs', () => ({
  InventoryTabs: () => <div data-testid="inventory-tabs">Tabs</div>,
}));

vi.mock('@/components/ErrorBoundary/InventoryErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="inventory-error-boundary">{children}</div>
  ),
}));

const createContextValue = (
  overrides: Partial<InventoryContextType>
): InventoryContextType => ({
  user: { id: 'user-1' },
  inventory: [],
  allItems: [],
  loadout: null,
  loading: false,
  equipping: null,
  error: null,
  searchQuery: '',
  selectedType: 'ALL',
  selectedRarity: 'ALL',
  showOwnedOnly: false,
  ownedItemIds: new Set(),
  filteredMyItems: [],
  filteredAllItems: [],
  setSearchQuery: vi.fn(),
  setSelectedType: vi.fn(),
  setSelectedRarity: vi.fn(),
  setShowOwnedOnly: vi.fn(),
  handleEquipItem: vi.fn(),
  handleUnequipItem: vi.fn(),
  refreshData: vi.fn(async () => {}),
  ...overrides,
});

describe('InventoryLayout', () => {
  beforeEach(() => {
    mockUseInventory.mockReset();
  });

  it('prompts login when user is missing', () => {
    mockUseInventory.mockReturnValue(createContextValue({ user: null }));

    render(<InventoryLayout />);

    expect(
      screen.getByText(/please log in to view your inventory/i)
    ).toBeInTheDocument();
  });

  it('renders loading indicator', () => {
    mockUseInventory.mockReturnValue(createContextValue({ loading: true }));

    render(<InventoryLayout />);

    expect(screen.getByText(/loading your inventory/i)).toBeInTheDocument();
  });

  it('renders error alert when present', () => {
    mockUseInventory.mockReturnValue(
      createContextValue({ error: 'Something went wrong' })
    );

    render(<InventoryLayout />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders inventory content when data is available', () => {
    mockUseInventory.mockReturnValue(
      createContextValue({
        inventory: [
          {
            id: 'item-1',
            userId: 'user-1',
            itemId: 'item-1',
            item: {
              id: 'item-1',
              name: 'Rare Cue',
              rarity: 'rare',
              price: 100,
            } as any,
            acquiredAt: '2024-01-01T00:00:00Z',
            source: 'drop',
            isEquipped: true,
          },
        ],
        ownedItemIds: new Set(['item-1']),
      })
    );

    render(
      <InventoryLayout>
        <div data-testid="inventory-children">Inventory Children</div>
      </InventoryLayout>
    );

    expect(screen.getByTestId('inventory-error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('inventory-header')).toBeInTheDocument();
    expect(screen.getByText(/Total Items: 1/)).toBeInTheDocument();
    expect(screen.getByTestId('inventory-filters')).toBeInTheDocument();
    expect(screen.getByTestId('inventory-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('inventory-children')).toBeInTheDocument();
  });
});
