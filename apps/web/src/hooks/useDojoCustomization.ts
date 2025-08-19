import { useCallback, useEffect, useState } from 'react';
import { dojoCustomizationService } from '../services/DojoCustomizationService';
import {
  CustomizationItem,
  DojoCustomization,
  DojoCustomizationCreate,
  DojoCustomizationStats,
} from '../types/dojoCustomization';

export const useDojoCustomization = (dojoId: string) => {
  const [customizations, setCustomizations] = useState<DojoCustomization[]>([]);
  const [availableItems, setAvailableItems] = useState<CustomizationItem[]>([]);
  const [stats, setStats] = useState<DojoCustomizationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDojoCustomizations = useCallback(async () => {
    if (!dojoId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await dojoCustomizationService.getDojoCustomizations(
        dojoId
      );
      setCustomizations(response.customizations);

      // Fetch stats
      const dojoStats =
        await dojoCustomizationService.getDojoCustomizationStats(dojoId);
      setStats(dojoStats);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch dojo customizations'
      );
    } finally {
      setLoading(false);
    }
  }, [dojoId]);

  const fetchAvailableItems = useCallback(async () => {
    try {
      setError(null);
      const response =
        await dojoCustomizationService.getAllCustomizationItems();
      setAvailableItems(response.items);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch available items'
      );
    }
  }, []);

  const unlockCustomization = useCallback(
    async (customization: DojoCustomizationCreate) => {
      try {
        setError(null);
        const newCustomization =
          await dojoCustomizationService.unlockCustomization(
            dojoId,
            customization
          );

        // Add to customizations list
        setCustomizations((prev) => [...prev, newCustomization]);

        // Refresh stats
        await fetchDojoCustomizations();

        return newCustomization;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to unlock customization'
        );
        throw err;
      }
    },
    [dojoId, fetchDojoCustomizations]
  );

  const applyCustomization = useCallback(
    async (customizationId: string, isApplied: boolean) => {
      try {
        setError(null);
        const updatedCustomization =
          await dojoCustomizationService.applyCustomization(
            dojoId,
            customizationId,
            { isApplied }
          );

        // Update in customizations list
        setCustomizations((prev) =>
          prev.map((customization) =>
            customization.id === customizationId
              ? updatedCustomization
              : customization
          )
        );

        // Refresh stats
        await fetchDojoCustomizations();

        return updatedCustomization;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to apply customization'
        );
        throw err;
      }
    },
    [dojoId, fetchDojoCustomizations]
  );

  const removeCustomization = useCallback(
    async (customizationId: string) => {
      try {
        setError(null);
        await dojoCustomizationService.removeCustomization(
          dojoId,
          customizationId
        );

        // Remove from customizations list
        setCustomizations((prev) =>
          prev.filter((customization) => customization.id !== customizationId)
        );

        // Refresh stats
        await fetchDojoCustomizations();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to remove customization'
        );
        throw err;
      }
    },
    [dojoId, fetchDojoCustomizations]
  );

  const getItemsByType = useCallback(
    (type: string) => {
      return availableItems.filter((item) => item.type === type);
    },
    [availableItems]
  );

  const getItemsByCategory = useCallback(
    (category: string) => {
      return availableItems.filter((item) => item.category === category);
    },
    [availableItems]
  );

  const searchItems = useCallback(async (query: string) => {
    try {
      setError(null);
      const results = await dojoCustomizationService.searchCustomizationItems(
        query
      );
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search items');
      return [];
    }
  }, []);

  const getUnlockedItems = useCallback(() => {
    return customizations.map(
      (customization) => customization.customizationItem
    );
  }, [customizations]);

  const getAppliedItems = useCallback(() => {
    return customizations.filter((customization) => customization.isApplied);
  }, [customizations]);

  const getUnlockedItemsByType = useCallback(
    (type: string) => {
      return customizations
        .filter(
          (customization) => customization.customizationItem.type === type
        )
        .map((customization) => customization.customizationItem);
    },
    [customizations]
  );

  useEffect(() => {
    if (dojoId) {
      fetchDojoCustomizations();
      fetchAvailableItems();
    }
  }, [dojoId, fetchDojoCustomizations, fetchAvailableItems]);

  return {
    // State
    customizations,
    availableItems,
    stats,
    loading,
    error,

    // Actions
    unlockCustomization,
    applyCustomization,
    removeCustomization,
    refresh: fetchDojoCustomizations,

    // Queries
    getItemsByType,
    getItemsByCategory,
    searchItems,
    getUnlockedItems,
    getAppliedItems,
    getUnlockedItemsByType,
  };
};
