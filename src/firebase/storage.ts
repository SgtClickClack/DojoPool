import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  type StorageReference,
} from 'firebase/storage';
import { storage } from './config';

// Upload file
export const uploadFile = async (path: string, file: File) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return { success: true, url: downloadURL };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get file URL
export const getFileURL = async (path: string) => {
  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    return { success: true, url };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Delete file
export const deleteFile = async (path: string) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// List files in a directory
export const listFiles = async (path: string) => {
  try {
    const storageRef = ref(storage, path);
    const res = await listAll(storageRef);
    const urls = await Promise.all(
      res.items.map(async (itemRef: StorageReference) => {
        const url = await getDownloadURL(itemRef);
        return {
          name: itemRef.name,
          fullPath: itemRef.fullPath,
          url,
        };
      })
    );
    return { success: true, files: urls };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Specific upload functions for DojoPool
export const uploadProfileImage = async (userId: string, file: File) => {
  return uploadFile(`users/${userId}/profile/${file.name}`, file);
};

export const uploadGameRecording = async (gameId: string, file: File) => {
  return uploadFile(`games/${gameId}/recordings/${file.name}`, file);
};

export const uploadVenueImage = async (venueId: string, file: File) => {
  return uploadFile(`venues/${venueId}/images/${file.name}`, file);
};
