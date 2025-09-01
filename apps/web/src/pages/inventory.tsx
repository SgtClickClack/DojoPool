import React from 'react';

import { InventoryDataProvider } from '@/components/Inventory/InventoryDataProvider';
import { InventoryLayout } from '@/components/Inventory/InventoryLayout';

const InventoryPage: React.FC = () => {
  return (
    <InventoryDataProvider>
      <InventoryLayout />
    </InventoryDataProvider>
  );
};

export default React.memo(InventoryPage);
