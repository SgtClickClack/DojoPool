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
import {
  type EquipmentSlot,
  type ItemRarity,
  type ItemType,
  type CosmeticItem,
} from '@/types/inventory';

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
  user: { id: string; username?: string } | null;
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
  handleEquipItem: (itemId: string, equipmentSlot: string) => Promise<void>;
  handleUnequipItem: (equipmentSlot: string) => Promise<void>;
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
      // Transform InventoryItem[] to CosmeticItem[]
      const transformedItems: CosmeticItem[] = allItemsResponse.map((item) => ({
        ...item,
        key: item.id, // Use id as key
        isDefault: false, // Default assumption
        isTradable: true, // Default assumption
        icon: item.imageUrl,
        previewImage: item.imageUrl,
        equipmentSlot: item.type === 'equipment' ? 'default' : undefined,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      }));
      setAllItems(transformedItems);

      // Fetch user's inventory
      const inventoryResponse = await APIService.getPlayerInventory(user!.id);
      // Transform UserInventory to PlayerInventoryItem[]
      const transformedInventory: PlayerInventoryItem[] =
        inventoryResponse.items.map((item) => ({
          id: `${user!.id}-${item.id}`, // Create composite ID
          userId: user!.id,
          itemId: item.id,
          item: {
            ...item,
            key: item.id,
            isDefault: false,
            isTradable: true,
            icon: item.imageUrl,
            previewImage: item.imageUrl,
            equipmentSlot: item.type === 'equipment' ? 'default' : undefined,
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || new Date().toISOString(),
          },
          acquiredAt: item.createdAt || new Date().toISOString(),
          source: 'unknown',
          isEquipped: item.equipped || false,
        }));
      setInventory(transformedInventory);

      // Fetch user's loadout with emote wheel data
      const loadoutData = await APIService.getPlayerLoadout(user!.id);
      setLoadout(loadoutData as PlayerLoadout | null);
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

  const handleEquipItem = async (itemId: string, equipmentSlot: string) => {
    if (!user?.id) return;

    try {
      setEquipping(itemId);
      await APIService.equipItem({
        userId: user.id,
        itemId,
        equipmentSlot: equipmentSlot as EquipmentSlot,
      });

      enqueueSnackbar('Item equipped successfully!', { variant: 'success' });

      // Refresh data
      await fetchInventoryData();
    } catch (err: unknown) {
      const message =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message || err.message
          : 'Failed to equip item';
      enqueueSnackbar(message, {
        variant: 'error',
      });
    } finally {
      setEquipping(null);
    }
  };

  const handleUnequipItem = async (equipmentSlot: string) => {
    if (!user?.id) return;

    try {
      setEquipping(equipmentSlot);
      await APIService.unequipItem({
        userId: user.id,
        equipmentSlot: equipmentSlot as EquipmentSlot,
      });

      enqueueSnackbar('Item unequipped successfully!', { variant: 'success' });

      // Refresh data
      await fetchInventoryData();
    } catch (err: unknown) {
      const message =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message || err.message
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
