import {
  type EquipmentSlot,
  type ItemType,
  type ItemRarity,
  type CosmeticItem,
} from '@/types/inventory';
import React from 'react';
import { InventoryGrid } from './InventoryGrid';
import { InventoryItemCard } from './InventoryItemCard';

interface _PlayerInventoryItem {
  id: string;
  userId: string;
  itemId: string;
  item: CosmeticItem;
  acquiredAt: string;
  source: string;
  isEquipped: boolean;
  equippedAt?: string;
}

interface MyItemsTabProps {
  items: CosmeticItem[];
  equipping: string | null;
  onEquipItem: (itemId: string, equipmentSlot: string) => Promise<void>;
  onUnequipItem: (equipmentSlot: string) => Promise<void>;
}

export const MyItemsTab: React.FC<MyItemsTabProps> = ({
  items,
  equipping: _equipping,
  onEquipItem,
  onUnequipItem,
}) => {
  const resolveSlot = (type: ItemType | string): string => {
    const t = String(type).toLowerCase();

    if (t.includes('cue')) return 'PRIMARY_CUE';
    if (t.includes('ball')) return 'BALL_SET';
    if (t.includes('table')) return 'TABLE_THEME';
    if (t.includes('frame')) return 'AVATAR_FRAME';
    if (t.includes('badge')) return 'PROFILE_BADGE';
    if (t.includes('title')) return 'TITLE';
    return 'PRIMARY_CUE';
  };

  const itemsToDisplay = items.map((item) => {
    const inventoryItem = null; // No inventory data passed in new props
    const isEquipped = false; // No inventory data passed in new props

    // Transform CosmeticItem to InventoryItemCard's expected item
    const displayItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      type: item.type,
      rarity: item.rarity,
      imageUrl: item.previewImage || item.icon,
      equipped: isEquipped,
    };

    const slotObj = resolveSlot(item.type);

    return (
      <InventoryItemCard
        key={item.id}
        item={displayItem}
        onEquip={(itemId) => onEquipItem(itemId, slotObj)}
        onUnequip={() => onUnequipItem(slotObj)}
        showEquipButton={true}
      />
    );
  });

  return (
    <InventoryGrid
      items={itemsToDisplay}
      emptyMessage="No items found matching your filters."
    />
  );
};
