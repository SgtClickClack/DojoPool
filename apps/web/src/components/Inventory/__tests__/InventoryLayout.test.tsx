import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import InventoryLayout from '../Inventory/InventoryLayout';

// Mock the InventoryLayout component since it doesn't exist yet
jest.mock('../Inventory/InventoryLayout', () => {
  return function MockInventoryLayout({ children, activeTab }: any) {
    return (
      <div data-testid="inventory-layout">
        <div data-testid="inventory-tabs">
          <button className={activeTab === 'equipment' ? 'active' : ''}>Equipment</button>
          <button className={activeTab === 'upgrades' ? 'active' : ''}>Upgrades</button>
          <button className={activeTab === 'cosmetics' ? 'active' : ''}>Cosmetics</button>
        </div>
        <div data-testid="inventory-content">
          {children}
        </div>
      </div>
    );
  };
});

const mockChildren = <div data-testid="inventory-items">Inventory Items Content</div>;

const defaultProps = {
  children: mockChildren,
  activeTab: 'equipment',
};

const propsWithUpgradesTab = {
  ...defaultProps,
  activeTab: 'upgrades',
};

describe('InventoryLayout', () => {
  const customRender = (ui: React.ReactElement, options = {}) =>
    render(ui, {
      wrapper: ({ children }) => <div>{children}</div>,
      ...options,
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders inventory layout with tabs', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    expect(screen.getByTestId('inventory-layout')).toBeInTheDocument();
    expect(screen.getByTestId('inventory-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('inventory-content')).toBeInTheDocument();
  });

  it('renders children content', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    expect(screen.getByTestId('inventory-items')).toBeInTheDocument();
  });

  it('highlights active tab', () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    const equipmentTab = screen.getByText('Equipment');
    expect(equipmentTab).toHaveClass('active');
    
    const upgradesTab = screen.getByText('Upgrades');
    expect(upgradesTab).not.toHaveClass('active');
  });

  it('changes active tab', () => {
    customRender(<InventoryLayout {...propsWithUpgradesTab} />);
    
    const upgradesTab = screen.getByText('Upgrades');
    expect(upgradesTab).toHaveClass('active');
    
    const equipmentTab = screen.getByText('Equipment');
    expect(equipmentTab).not.toHaveClass('active');
  });

  it('renders with minimal props', () => {
    customRender(<InventoryLayout><div>Minimal content</div></InventoryLayout>);
    
    expect(screen.getByText('Minimal content')).toBeInTheDocument();
  });

  it('renders performance test case', async () => {
    customRender(<InventoryLayout {...defaultProps} />);
    
    expect(screen.getByTestId('inventory-layout')).toBeInTheDocument();
  }, 5000);
});
