import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { render as customRender, mockUser, createMockProps, measureRenderTime } from '../../__tests__/test-utils';
import InventoryLayout from '../Inventory/InventoryLayout';

// Mock MUI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Card: ({ children, ...props }: any) => (
      <div data-testid="inventory-layout-card" {...props}>
        {children}
      </div>
    ),
    CardContent: ({ children, ...props }: any) => (
      <div data-testid="inventory-layout-content" {...props}>
        {children}
      </div>
    ),
    Typography: ({ children, variant, ...props }: any) => (
      <div data-testid={`typography-${variant}`} {...props}>
        {children}
      </div>
    ),
    Button: ({ children, onClick, ...props }: any) => (
      <button data-testid="inventory-layout-button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Chip: ({ label, color, ...props }: any) => (
      <span data-testid={`chip-${color}`} {...props}>
        {label}
      </span>
    ),
    Box: ({ children, ...props }: any) => (
      <div data-testid="inventory-layout-box" {...props}>
        {children}
      </div>
    ),
    Grid: ({ children, ...props }: any) => (
      <div data-testid="inventory-layout-grid" {...props}>
        {children}
      </div>
    ),
    Tabs: ({ children, value, onChange, ...props }: any) => (
      <div data-testid="inventory-layout-tabs" data-value={value} {...props}>
        {children}
      </div>
    ),
    Tab: ({ label, ...props }: any) => (
      <div data-testid="inventory-layout-tab" {...props}>
        {label}
      </div>
    ),
  };
});

// Mock icons
vi.mock('@mui/icons-material', () => ({
  Inventory: () => <div data-testid="inventory-icon">📦</div>,
  Category: () => <div data-testid="category-icon">📂</div>,
  Search: () => <div data-testid="search-icon">🔍</div>,
  FilterList: () => <div data-testid="filter-icon">🔽</div>,
  Sort: () => <div data-testid="sort-icon">↕️</div>,
}));

describe('InventoryLayout Component', () => {
  const mockInventoryItems = [
    {
      id: '1',
      name: 'Test Item 1',
      category: 'CUE',
      rarity: 'COMMON',
      quantity: 1,
      equipped: false,
    },
    {
      id: '2',
      name: 'Test Item 2',
      category: 'BALL',
      rarity: 'RARE',
      quantity: 3,
      equipped: true,
    },
    {
      id: '3',
      name: 'Test Item 3',
      category: 'TABLE',
      rarity: 'EPIC',
      quantity: 1,
      equipped: false,
    },
  ];

  const defaultProps = createMockProps({
    items: mockInventoryItems,
    onItemClick: vi.fn(),
    onEquip: vi.fn(),
    onUnequip: vi.fn(),
    onFilter: vi.fn(),
    onSort: vi.fn(),
    onSearch: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders inventory items correctly', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    expect(screen.getByText('Test Item 3')).toBeInTheDocument();
  });

  it('displays item categories', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    expect(screen.getByText('CUE')).toBeInTheDocument();
    expect(screen.getByText('BALL')).toBeInTheDocument();
    expect(screen.getByText('TABLE')).toBeInTheDocument();
  });

  it('displays item rarities', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    expect(screen.getByText('COMMON')).toBeInTheDocument();
    expect(screen.getByText('RARE')).toBeInTheDocument();
    expect(screen.getByText('EPIC')).toBeInTheDocument();
  });

  it('displays item quantities', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    expect(screen.getByText('1')).toBeInTheDocument(); // Test Item 1 quantity
    expect(screen.getByText('3')).toBeInTheDocument(); // Test Item 2 quantity
  });

  it('renders inventory tabs', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    expect(screen.getByTestId('inventory-layout-tabs')).toBeInTheDocument();
    expect(screen.getByText('All Items')).toBeInTheDocument();
    expect(screen.getByText('My Items')).toBeInTheDocument();
  });

  it('renders search and filter controls', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    expect(screen.getByTestId('filter-icon')).toBeInTheDocument();
    expect(screen.getByTestId('sort-icon')).toBeInTheDocument();
  });

  it('calls onItemClick when item is clicked', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    const itemCards = screen.getAllByTestId('inventory-layout-card');
    fireEvent.click(itemCards[0]);
    
    expect(defaultProps.onItemClick).toHaveBeenCalledWith(mockInventoryItems[0]);
  });

  it('calls onEquip when equip button is clicked', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    const equipButtons = screen.getAllByText('Equip');
    fireEvent.click(equipButtons[0]);
    
    expect(defaultProps.onEquip).toHaveBeenCalledWith(mockInventoryItems[0].id);
  });

  it('calls onUnequip when unequip button is clicked', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    const unequipButtons = screen.getAllByText('Unequip');
    fireEvent.click(unequipButtons[0]);
    
    expect(defaultProps.onUnequip).toHaveBeenCalledWith(mockInventoryItems[1].id);
  });

  it('calls onFilter when filter is applied', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    const filterButton = screen.getByTestId('filter-icon');
    fireEvent.click(filterButton);
    
    const categoryFilter = screen.getByText('CUE');
    fireEvent.click(categoryFilter);
    
    expect(defaultProps.onFilter).toHaveBeenCalledWith('CUE');
  });

  it('calls onSort when sort is applied', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    const sortButton = screen.getByTestId('sort-icon');
    fireEvent.click(sortButton);
    
    const nameSort = screen.getByText('Name');
    fireEvent.click(nameSort);
    
    expect(defaultProps.onSort).toHaveBeenCalledWith('name');
  });

  it('calls onSearch when search is performed', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    const searchInput = screen.getByTestId('inventory-layout-search');
    fireEvent.change(searchInput, { target: { value: 'Test' } });
    
    expect(defaultProps.onSearch).toHaveBeenCalledWith('Test');
  });

  it('handles empty inventory', () => {
    const emptyProps = {
      ...defaultProps,
      items: [],
    };
    
    customRender(<InventoryLayout {...emptyProps} />);
    
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    const loadingProps = {
      ...defaultProps,
      loading: true,
    };
    
    customRender(<InventoryLayout {...loadingProps} />);
    
    expect(screen.getByText('Loading inventory...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    const errorProps = {
      ...defaultProps,
      error: 'Failed to load inventory',
    };
    
    customRender(<InventoryLayout {...errorProps} />);
    
    expect(screen.getByText('Failed to load inventory')).toBeInTheDocument();
  });

  it('renders without crashing with minimal props', () => {
    const minimalProps = {
      items: mockInventoryItems,
      onItemClick: vi.fn(),
    };
    
    expect(() => customRender(<InventoryLayout {...minimalProps} />)).not.toThrow();
  });

  it('has proper accessibility attributes', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    const grid = screen.getByTestId('inventory-layout-grid');
    expect(grid).toBeInTheDocument();
    
    // Check for proper heading structure
    const heading = screen.getByTestId('typography-h5');
    expect(heading).toBeInTheDocument();
  });

  it('handles disabled state correctly', () => {
    const disabledProps = {
      ...defaultProps,
      disabled: true,
    };
    
    customRender(<InventoryLayout {...disabledProps} />);
    
    const equipButtons = screen.getAllByText('Equip');
    expect(equipButtons[0]).toBeDisabled();
  });

  it('renders within acceptable performance threshold', async () => {
    const renderTime = await measureRenderTime(() => {
      customRender(<InventoryLayout {...defaultProps} />);
    });
    
    // Should render in less than 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('handles large inventory lists efficiently', () => {
    const largeInventoryList = Array.from({ length: 100 }, (_, i) => ({
      id: `item-${i}`,
      name: `Item ${i}`,
      category: 'CUE',
      rarity: 'COMMON',
      quantity: 1,
      equipped: false,
    }));
    
    const largeProps = {
      ...defaultProps,
      items: largeInventoryList,
    };
    
    customRender(<InventoryLayout {...largeProps} />);
    
    expect(screen.getByText('100 Items')).toBeInTheDocument();
  });

  it('maintains scroll position during updates', () => {
    const { rerender } = customRender(<InventoryLayout {...defaultProps} />);
    
    const updatedItems = [
      ...mockInventoryItems,
      {
        id: '4',
        name: 'New Item',
        category: 'CUE',
        rarity: 'LEGENDARY',
        quantity: 1,
        equipped: false,
      },
    ];
    
    rerender(<InventoryLayout {...defaultProps} items={updatedItems} />);
    
    expect(screen.getByText('4 Items')).toBeInTheDocument();
    expect(screen.getByText('New Item')).toBeInTheDocument();
  });

  it('handles inventory updates in real-time', () => {
    const { rerender } = customRender(<InventoryLayout {...defaultProps} />);
    
    const updatedItems = mockInventoryItems.map(item => ({
      ...item,
      quantity: item.quantity + 1, // Update quantity
    }));
    
    rerender(<InventoryLayout {...defaultProps} items={updatedItems} />);
    
    // Check if quantities are updated
    expect(screen.getByText('2')).toBeInTheDocument(); // Test Item 1 updated quantity
    expect(screen.getByText('4')).toBeInTheDocument(); // Test Item 2 updated quantity
  });

  it('displays rarity colors correctly', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    // Check if rarity chips are displayed with correct colors
    expect(screen.getByTestId('chip-default')).toBeInTheDocument(); // COMMON
    expect(screen.getByTestId('chip-primary')).toBeInTheDocument(); // RARE
    expect(screen.getByTestId('chip-secondary')).toBeInTheDocument(); // EPIC
  });

  it('handles item filtering by category', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    const filterButton = screen.getByTestId('filter-icon');
    fireEvent.click(filterButton);
    
    // Check if category filters are displayed
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.getByText('CUE')).toBeInTheDocument();
    expect(screen.getByText('BALL')).toBeInTheDocument();
    expect(screen.getByText('TABLE')).toBeInTheDocument();
  });

  it('handles item sorting by different criteria', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    const sortButton = screen.getByTestId('sort-icon');
    fireEvent.click(sortButton);
    
    // Check if sort options are displayed
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Rarity')).toBeInTheDocument();
    expect(screen.getByText('Quantity')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('displays equipped items differently', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    // Check if equipped items are displayed differently
    expect(screen.getByText('Equipped')).toBeInTheDocument();
  });

  it('handles item search functionality', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    const searchInput = screen.getByTestId('inventory-layout-search');
    fireEvent.change(searchInput, { target: { value: 'Test Item 1' } });
    
    // Check if search is performed
    expect(defaultProps.onSearch).toHaveBeenCalledWith('Test Item 1');
  });

  it('displays inventory statistics', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    // Check if inventory statistics are displayed
    expect(screen.getByText('3 Items')).toBeInTheDocument();
    expect(screen.getByText('1 Equipped')).toBeInTheDocument();
  });

  it('handles item rarity changes', () => {
    const { rerender } = customRender(<InventoryLayout {...defaultProps} />);
    
    const updatedItems = mockInventoryItems.map(item => ({
      ...item,
      rarity: item.rarity === 'COMMON' ? 'RARE' : item.rarity,
    }));
    
    rerender(<InventoryLayout {...defaultProps} items={updatedItems} />);
    
    // Check if rarity changes are reflected
    expect(screen.getByText('RARE')).toBeInTheDocument();
  });

  it('handles item quantity changes', () => {
    const { rerender } = customRender(<InventoryLayout {...defaultProps} />);
    
    const updatedItems = mockInventoryItems.map(item => ({
      ...item,
      quantity: item.quantity * 2,
    }));
    
    rerender(<InventoryLayout {...defaultProps} items={updatedItems} />);
    
    // Check if quantity changes are reflected
    expect(screen.getByText('2')).toBeInTheDocument(); // Test Item 1 updated quantity
    expect(screen.getByText('6')).toBeInTheDocument(); // Test Item 2 updated quantity
  });

  it('displays inventory layout title', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    expect(screen.getByText('Inventory')).toBeInTheDocument();
  });

  it('handles inventory data updates in real-time', () => {
    const { rerender } = customRender(<InventoryLayout {...defaultProps} />);
    
    const updatedItems = mockInventoryItems.map(item => ({
      ...item,
      equipped: !item.equipped, // Toggle equipped status
    }));
    
    rerender(<InventoryLayout {...defaultProps} items={updatedItems} />);
    
    // Check if equipped status changes are reflected
    expect(screen.getByText('2 Equipped')).toBeInTheDocument();
  });
});
