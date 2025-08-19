import { useState, useCallback } from 'react';
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  getActiveGames,
  getVenuesByLocation,
  getUpcomingTournaments,
} from '@/firebase/firestore';
import { type FirebaseResponse } from '@/firebase/types';

export const useFirestore = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (error: any) => {
    setError(error.message);
    setTimeout(() => setError(null), 5000);
  };

  const create = async <T>(
    collection: string,
    data: T
  ): Promise<FirebaseResponse<string>> => {
    try {
      setLoading(true);
      const result = await createDocument(collection, data);
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const get = async <T>(
    collection: string,
    id: string
  ): Promise<FirebaseResponse<T>> => {
    try {
      setLoading(true);
      const result = await getDocument(collection, id);
      if (!result.success) throw new Error(result.error);
      return result as FirebaseResponse<T>;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const update = async <T>(
    collection: string,
    id: string,
    data: Partial<T>
  ): Promise<FirebaseResponse<void>> => {
    try {
      setLoading(true);
      const result = await updateDocument(collection, id, data);
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const remove = async (
    collection: string,
    id: string
  ): Promise<FirebaseResponse<void>> => {
    try {
      setLoading(true);
      const result = await deleteDocument(collection, id);
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const query = async <T>(
    collection: string,
    constraints: any[] = [],
    limit: number = 10
  ): Promise<FirebaseResponse<T[]>> => {
    try {
      setLoading(true);
      const result = await queryDocuments(collection, constraints, limit);
      if (!result.success) throw new Error(result.error);
      return result as FirebaseResponse<T[]>;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Specialized queries
  const getActive = useCallback(async (limit: number = 10) => {
    try {
      setLoading(true);
      const result = await getActiveGames(limit);
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getVenues = useCallback(
    async (location: string, limit: number = 10) => {
      try {
        setLoading(true);
        const result = await getVenuesByLocation(location, limit);
        if (!result.success) throw new Error(result.error);
        return result;
      } catch (error: any) {
        handleError(error);
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getUpcoming = useCallback(async (limit: number = 10) => {
    try {
      setLoading(true);
      const result = await getUpcomingTournaments(limit);
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    create,
    get,
    update,
    remove,
    query,
    getActive,
    getVenues,
    getUpcoming,
  };
};
