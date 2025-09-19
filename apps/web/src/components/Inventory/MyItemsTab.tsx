import { type EquipmentSlot } from '@/types/inventory';
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
  equipmentSlot?: EquipmentSlot;
  createdAt: string;
  updatedAt: string;
}

interface PlayerInventoryItem {
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
  onEquipItem: (itemId: string, equipmentSlot: EquipmentSlot) => Promise<void>;
  onUnequipItem: (equipmentSlot: EquipmentSlot) => Promise<void>;
}

export const MyItemsTab: React.FC<MyItemsTabProps> = ({
  items,
  equipping,
  onEquipItem,
  onUnequipItem,
}) => {
  const resolveSlot = (type: any): EquipmentSlot => {
    const t = String(type).toLowerCase();
    const makeSlot = (id: string, name: string): EquipmentSlot =>
      ({
        id,
        name,
        type: 'equipment',
      }) as unknown as EquipmentSlot;

    if (t.includes('cue')) return makeSlot('PRIMARY_CUE', 'Primary Cue');
    if (t.includes('ball')) return makeSlot('BALL_SET', 'Ball Set');
    if (t.includes('table')) return makeSlot('TABLE_THEME', 'Table Theme');
    if (t.includes('frame')) return makeSlot('AVATAR_FRAME', 'Avatar Frame');
    if (t.includes('badge')) return makeSlot('PROFILE_BADGE', 'Profile Badge');
    if (t.includes('title')) return makeSlot('TITLE', 'Title');
    return makeSlot('PRIMARY_CUE', 'Primary Cue');
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
