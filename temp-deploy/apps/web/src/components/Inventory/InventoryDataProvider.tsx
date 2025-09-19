import { enqueueSnackbar } from 'notistack';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/hooks/useAuth';
import * as APIService from '@/services/APIService';
import { EquipmentSlot, ItemRarity, ItemType } from '@/types/inventory';

interface CosmeticItem {
  id: string;
  key: string;
  name: string;
  description?: string;
  type: ItemType;
  rarity: ItemRarity;
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

interface PlayerLoadout {
  id: string;
  userId: string;
  primaryCueId?: string;
  primaryCue?: CosmeticItem;
  ballSetId?: string;
  ballSet?: CosmeticItem;
  tableThemeId?: string;
  tableTheme?: CosmeticItem;
  avatarFrameId?: string;
  avatarFrame?: CosmeticItem;
  profileBadgeId?: string;
  profileBadge?: CosmeticItem;
  titleId?: string;
  title?: CosmeticItem;
  emoteWheel1Id?: string;
  emoteWheel1?: CosmeticItem;
  emoteWheel2Id?: string;
  emoteWheel2?: CosmeticItem;
  emoteWheel3Id?: string;
  emoteWheel3?: CosmeticItem;
  emoteWheel4Id?: string;
  emoteWheel4?: CosmeticItem;
  emoteWheel5Id?: string;
  emoteWheel5?: CosmeticItem;
  emoteWheel6Id?: string;
  emoteWheel6?: CosmeticItem;
  createdAt: string;
  updatedAt: string;
}

interface InventoryContextType {
  user: any;
  inventory: PlayerInventoryItem[];
  allItems: CosmeticItem[];
  loadout: PlayerLoadout | null;
  loading: boolean;
  equipping: string | null;
  error: string | null;
  searchQuery: string;
  selectedType: ItemType | 'ALL';
  selectedRarity: ItemRarity | 'ALL';
  showOwnedOnly: boolean;
  ownedItemIds: Set<string>;
  filteredMyItems: CosmeticItem[];
  filteredAllItems: CosmeticItem[];
  setSearchQuery: (query: string) => void;
  setSelectedType: (type: ItemType | 'ALL') => void;
  setSelectedRarity: (rarity: ItemRarity | 'ALL') => void;
  setShowOwnedOnly: (show: boolean) => void;
  handleEquipItem: (
    itemId: string,
    equipmentSlot: EquipmentSlot
  ) => Promise<void>;
  handleUnequipItem: (equipmentSlot: EquipmentSlot) => Promise<void>;
  refreshData: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within InventoryDataProvider');
  }
  return context;
};

interface InventoryDataProviderProps {
  children: React.ReactNode;
}

export const InventoryDataProvider: React.FC<InventoryDataProviderProps> = ({
  children,
}) => {
  const { user } = useAuth();

  const [inventory, setInventory] = useState<PlayerInventoryItem[]>([]);
  const [allItems, setAllItems] = useState<CosmeticItem[]>([]);
  const [loadout, setLoadout] = useState<PlayerLoadout | null>(null);
  const [loading, setLoading] = useState(true);
  const [equipping, setEquipping] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ItemType | 'ALL'>('ALL');
  const [selectedRarity, setSelectedRarity] = useState<ItemRarity | 'ALL'>(
    'ALL'
  );
  const [showOwnedOnly, setShowOwnedOnly] = useState(false);

  // Memoize fetch function to prevent unnecessary re-renders
  const fetchInventoryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all available items
      const allItemsResponse = await APIService.getAllItems();
      setAllItems(allItemsResponse);

      // Fetch user's inventory
      const inventoryResponse = await APIService.getPlayerInventory(user!.id);
      setInventory(inventoryResponse);

      // Fetch user's loadout with emote wheel data
      const loadoutData = await APIService.getPlayerLoadout(user!.id);
      setLoadout(loadoutData);
    } catch (err) {
      console.error('Failed to fetch inventory data:', err);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      fetchInventoryData().catch(console.error);
    }
  }, [user, fetchInventoryData]);

  const handleEquipItem = async (
    itemId: string,
    equipmentSlot: EquipmentSlot
  ) => {
    if (!user?.id) return;

    try {
      setEquipping(itemId);
      await APIService.equipItem({
        userId: user.id,
        itemId,
        equipmentSlot,
      });

      enqueueSnackbar('Item equipped successfully!', { variant: 'success' });

      // Refresh data
      await fetchInventoryData();
    } catch (err: unknown) {
      const message =
        err instanceof Error && 'response' in err
          ? (err as any).response?.data?.message || err.message
          : 'Failed to equip item';
      enqueueSnackbar(message, {
        variant: 'error',
      });
    } finally {
      setEquipping(null);
    }
  };

  const handleUnequipItem = async (equipmentSlot: EquipmentSlot) => {
    if (!user?.id) return;

    try {
      setEquipping((equipmentSlot as any)?.id ?? null);
      await APIService.unequipItem({
        userId: user.id,
        equipmentSlot,
      });

      enqueueSnackbar('Item unequipped successfully!', { variant: 'success' });

      // Refresh data
      await fetchInventoryData();
    } catch (err: unknown) {
      const message =
        err instanceof Error && 'response' in err
          ? (err as any).response?.data?.message || err.message
          : 'Failed to unequip item';
      enqueueSnackbar(message, {
        variant: 'error',
      });
    } finally {
      setEquipping(null);
    }
  };

  // Memoize owned item IDs for quick lookup
  const ownedItemIds = useMemo(
    () => new Set(inventory.map((item) => item.itemId)),
    [inventory]
  );

  // Memoize filtered items to prevent recalculation on every render
  const filteredMyItems = useMemo(() => {
    return inventory
      .map((inv) => inv.item)
      .filter((item) => {
        const matchesSearch =
          !searchQuery ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType =
          selectedType === 'ALL' || item.type === selectedType;
        const matchesRarity =
          selectedRarity === 'ALL' || item.rarity === selectedRarity;

        return matchesSearch && matchesType && matchesRarity;
      });
  }, [inventory, searchQuery, selectedType, selectedRarity]);

  // Memoize filtered all items
  const filteredAllItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === 'ALL' || item.type === selectedType;
      const matchesRarity =
        selectedRarity === 'ALL' || item.rarity === selectedRarity;
      const matchesOwnership = !showOwnedOnly || ownedItemIds.has(item.id);

      return matchesSearch && matchesType && matchesRarity && matchesOwnership;
    });
  }, [
    allItems,
    searchQuery,
    selectedType,
    selectedRarity,
    showOwnedOnly,
    ownedItemIds,
  ]);

  const value: InventoryContextType = {
    user,
    inventory,
    allItems,
    loadout,
    loading,
    equipping,
    error,
    searchQuery,
    selectedType,
    selectedRarity,
    showOwnedOnly,
    ownedItemIds,
    filteredMyItems,
    filteredAllItems,
    setSearchQuery,
    setSelectedType,
    setSelectedRarity,
    setShowOwnedOnly,
    handleEquipItem,
    handleUnequipItem,
    refreshData: fetchInventoryData,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};
