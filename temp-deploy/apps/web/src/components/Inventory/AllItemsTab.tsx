import React from 'react';
import { InventoryGrid } from './InventoryGrid';
import { InventoryItemCard } from './InventoryItemCard';

interface CosmeticItem {
  id: string;
  key: string;
  name: string;
  description?: string;
  type: any;
  rarity: any;
  icon?: string;
  previewImage?: string;
  isDefault: boolean;
  isTradable: boolean;
  price?: number;
  equipmentSlot?: any;
  createdAt: string;
  updatedAt: string;
}

interface AllItemsTabProps {
  items: CosmeticItem[];
  ownedItemIds: Set<string>;
  equipping: string | null;
  onEquipItem: (itemId: string, equipmentSlot: any) => Promise<void>;
  onUnequipItem: (equipmentSlot: any) => Promise<void>;
}

export const AllItemsTab: React.FC<AllItemsTabProps> = ({
  items,
  ownedItemIds,
  equipping,
  onEquipItem,
  onUnequipItem,
}) => {
  const itemsToRender = items.map((item) => {
    // Transform CosmeticItem to InventoryItemCard's expected item shape
    const transformedItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      type: item.type,
      rarity: item.rarity,
      imageUrl: item.previewImage || item.icon,
      equipped: false,
    };

    return (
      <InventoryItemCard
        key={item.id}
        item={transformedItem}
        showEquipButton={false}
      />
    );
  });

  return (
    <InventoryGrid
      items={itemsToRender}
      emptyMessage="No items found matching your filters."
    />
  );
};
