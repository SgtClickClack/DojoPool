import { useState } from 'react';
import {
  uploadFile,
  getFileURL,
  deleteFile,
  listFiles,
  uploadProfileImage,
  uploadGameRecording,
  uploadVenueImage,
} from '@/firebase/storage';
import { type FirebaseResponse } from '@/firebase/types';

export const useStorage = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleError = (error: any) => {
    setError(error.message);
    setTimeout(() => setError(null), 5000);
  };

  const upload = async (
    path: string,
    file: File
  ): Promise<FirebaseResponse<string>> => {
    try {
      setLoading(true);
      setProgress(0);
      const result = await uploadFile(path, file);
      if (!result.success) throw new Error(result.error);
      setProgress(100);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const getURL = async (path: string): Promise<FirebaseResponse<string>> => {
    try {
      setLoading(true);
      const result = await getFileURL(path);
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const remove = async (path: string): Promise<FirebaseResponse<void>> => {
    try {
      setLoading(true);
      const result = await deleteFile(path);
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const list = async (path: string): Promise<FirebaseResponse<any[]>> => {
    try {
      setLoading(true);
      const result = await listFiles(path);
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Specialized upload functions
  const uploadProfile = async (
    userId: string,
    file: File
  ): Promise<FirebaseResponse<string>> => {
    try {
      setLoading(true);
      setProgress(0);
      const result = await uploadProfileImage(userId, file);
      if (!result.success) throw new Error(result.error);
      setProgress(100);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const uploadGame = async (
    gameId: string,
    file: File
  ): Promise<FirebaseResponse<string>> => {
    try {
      setLoading(true);
      setProgress(0);
      const result = await uploadGameRecording(gameId, file);
      if (!result.success) throw new Error(result.error);
      setProgress(100);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const uploadVenue = async (
    venueId: string,
    file: File
  ): Promise<FirebaseResponse<string>> => {
    try {
      setLoading(true);
      setProgress(0);
      const result = await uploadVenueImage(venueId, file);
      if (!result.success) throw new Error(result.error);
      setProgress(100);
      return result;
    } catch (error: any) {
      handleError(error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    progress,
    error,
    upload,
    getURL,
    remove,
    list,
    uploadProfile,
    uploadGame,
    uploadVenue,
  };
};
