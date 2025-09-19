import { Paper, Tab, Tabs } from '@mui/material';
import React, { useState } from 'react';
import { AllItemsTab } from './AllItemsTab';
import { useInventory } from './InventoryDataProvider';
import { LoadoutDisplay } from './LoadoutDisplay';
import { MyItemsTab } from './MyItemsTab';

export const InventoryTabs: React.FC = () => {
  const {
    inventory,
    filteredMyItems,
    filteredAllItems,
    ownedItemIds,
    loadout,
    user,
    equipping,
    handleEquipItem,
    handleUnequipItem,
  } = useInventory();

  const [activeTab, setActiveTab] = useState(0);

  const mapItem = (item?: any) =>
    item
      ? {
          id: item.id,
          name: item.name,
          type: String(item.type),
          rarity: String(item.rarity),
          icon: item.icon,
          previewImage: item.previewImage,
          isDefault: item.isDefault,
          isTradable: item.isTradable,
          price: item.price,
          equipmentSlot: item.equipmentSlot,
        }
      : null;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Paper sx={{ width: '100%' }}>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        variant="fullWidth"
      >
        <Tab label="My Items" />
        <Tab label="All Items" />
        <Tab label="Loadout" />
      </Tabs>

      {activeTab === 0 && (
        <MyItemsTab
          items={filteredMyItems}
          equipping={equipping}
          onEquipItem={handleEquipItem}
          onUnequipItem={handleUnequipItem}
        />
      )}

      {activeTab === 1 && (
        <AllItemsTab
          items={filteredAllItems}
          ownedItemIds={ownedItemIds}
          equipping={equipping}
          onEquipItem={handleEquipItem}
          onUnequipItem={handleUnequipItem}
        />
      )}

      {activeTab === 2 && (
        <LoadoutDisplay
          loadout={{
            primaryCue: mapItem(loadout?.primaryCue),
            ballSet: mapItem(loadout?.ballSet),
            tableTheme: mapItem(loadout?.tableTheme),
            avatarFrame: mapItem(loadout?.avatarFrame),
            profileBadge: mapItem(loadout?.profileBadge),
            title: mapItem(loadout?.title),
            emoteWheel1: mapItem(loadout?.emoteWheel1),
            emoteWheel2: mapItem(loadout?.emoteWheel2),
            emoteWheel3: mapItem(loadout?.emoteWheel3),
            emoteWheel4: mapItem(loadout?.emoteWheel4),
            emoteWheel5: mapItem(loadout?.emoteWheel5),
            emoteWheel6: mapItem(loadout?.emoteWheel6),
          }}
          user={user}
          equipping={equipping}
          onEquipItem={handleEquipItem}
          onUnequipItem={handleUnequipItem}
        />
      )}
    </Paper>
  );
};
