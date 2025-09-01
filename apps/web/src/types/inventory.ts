export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type ItemType = 'cosmetic' | 'equipment' | 'emote';

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  type: ItemType;
  rarity: ItemRarity;
  imageUrl?: string;
  equipped?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EquipmentSlot {
  id: string;
  name: string;
  type: ItemType;
  item?: InventoryItem;
}

export interface UserInventory {
  items: InventoryItem[];
  equippedItems: { [slot: string]: InventoryItem };
  totalItems: number;
  maxSlots: number;
}

export interface InventoryFilters {
  search: string;
  rarity: ItemRarity | '';
  type: ItemType | '';
  sortBy: 'name' | 'rarity' | 'type' | 'date';
}
