import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { InventoryView } from '../../../apps/web/components/marketplace/[MARKET]InventoryView';
import * as marketplaceModule from '../../../apps/web/services/marketplace';

const inventoryItems: marketplaceModule.MarketplaceItem[] = [
  {
    id: 'inv-1',
    name: 'Starter Cue',
    description: 'A basic cue for new players',
    price: 0,
    type: 'item',
    image: '/img/starter-cue.png',
    quantity: 1,
  },
];

describe('InventoryView', () => {
  let fetchInventorySpy: any;

  beforeEach(() => {
    fetchInventorySpy = vi
      .spyOn(marketplaceModule.marketplaceService, 'fetchInventory')
      .mockResolvedValue(inventoryItems);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithRouter = () =>
    render(
      <MemoryRouter initialEntries={["/marketplace/inventory"]}>
        <Routes>
          <Route path="/marketplace/inventory" element={<InventoryView />} />
        </Routes>
      </MemoryRouter>
    );

  it('renders loading then inventory items', async () => {
    renderWithRouter();

    // Loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Items render after fetch resolves
    await waitFor(() => {
      expect(screen.getByText(/your inventory/i)).toBeInTheDocument();
      expect(screen.getByText('Starter Cue')).toBeInTheDocument();
      expect(screen.getByText(/a basic cue for new players/i)).toBeInTheDocument();
    });

    expect(fetchInventorySpy).toHaveBeenCalled();
  });
});
