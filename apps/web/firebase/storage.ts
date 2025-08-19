// Temporarily disabled due to Firebase import issues
// import {
//   ref,
//   uploadBytes,
//   getDownloadURL,
//   deleteObject,
//   listAll,
//   type StorageReference,
// } from 'firebase/storage';
// import { storage } from './config';

// Upload file - temporarily disabled
export const uploadFile = async (path: string, file: File) => {
  try {
    console.log('File upload temporarily disabled', { path, fileName: file.name });
    return { success: false, error: 'File upload temporarily disabled' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get file URL - temporarily disabled
export const getFileURL = async (path: string) => {
  try {
    console.log('File URL retrieval temporarily disabled', { path });
    return { success: false, error: 'File URL retrieval temporarily disabled' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Delete file - temporarily disabled
export const deleteFile = async (path: string) => {
  try {
    console.log('File deletion temporarily disabled', { path });
    return { success: false, error: 'File deletion temporarily disabled' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// List files in a directory - temporarily disabled
export const listFiles = async (path: string) => {
  try {
    console.log('File listing temporarily disabled', { path });
    return { success: false, error: 'File listing temporarily disabled' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Specific upload functions for DojoPool - temporarily disabled
export const uploadProfileImage = async (userId: string, file: File) => {
  console.log('Profile image upload temporarily disabled', { userId, fileName: file.name });
  return { success: false, error: 'Profile image upload temporarily disabled' };
};

export const uploadGameRecording = async (gameId: string, file: File) => {
  console.log('Game recording upload temporarily disabled', { gameId, fileName: file.name });
  return { success: false, error: 'Game recording upload temporarily disabled' };
};

export const uploadVenueImage = async (venueId: string, file: File) => {
  console.log('Venue image upload temporarily disabled', { venueId, fileName: file.name });
  return { success: false, error: 'Venue image upload temporarily disabled' };
};
