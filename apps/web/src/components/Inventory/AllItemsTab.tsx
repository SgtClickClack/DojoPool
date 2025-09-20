import React from 'react';
import { InventoryGrid } from './InventoryGrid';
import { InventoryItemCard } from './InventoryItemCard';
import {
  type EquipmentSlot,
  type ItemType,
  type ItemRarity,
  type CosmeticItem,
} from '@/types/inventory';

interface AllItemsTabProps {
  items: CosmeticItem[];
  ownedItemIds: Set<string>;
  equipping: string | null;
  onEquipItem: (itemId: string, equipmentSlot: string) => Promise<void>;
  onUnequipItem: (equipmentSlot: string) => Promise<void>;
}

export const AllItemsTab: React.FC<AllItemsTabProps> = ({
  items,
  ownedItemIds: _ownedItemIds,
  equipping: _equipping,
  onEquipItem: _onEquipItem,
  onUnequipItem: _onUnequipItem,
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
