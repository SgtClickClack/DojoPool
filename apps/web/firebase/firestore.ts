// Temporarily disabled due to Firebase import issues
// import {
//   collection,
//   doc,
//   getDoc,
//   getDocs,
//   query,
//   where,
//   orderBy,
//   limit,
//   startAfter,
//   addDoc,
//   updateDoc,
//   deleteDoc,
//   serverTimestamp,
//   type DocumentData,
//   type QueryConstraint,
//   startAt,
//   endAt,
//   getCountFromServer,
// } from 'firebase/firestore';
// import { db } from './config';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_SIZE = 100; // Maximum number of documents to cache

// In-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();

// Generic CRUD operations with caching - temporarily disabled
export const createDocument = async (collectionName: string, data: any) => {
  try {
    console.log('Document creation temporarily disabled', { collectionName, data });
    return { success: false, error: 'Document creation temporarily disabled' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getDocument = async (
  collectionName: string,
  documentId: string
) => {
  try {
    console.log('Document retrieval temporarily disabled', { collectionName, documentId });
    return { success: false, error: 'Document retrieval temporarily disabled' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateDocument = async (
  collectionName: string,
  documentId: string,
  data: Record<string, unknown>
) => {
  try {
    console.log('Document update temporarily disabled', { collectionName, documentId, data });
    return { success: false, error: 'Document update temporarily disabled' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteDocument = async (
  collectionName: string,
  documentId: string
) => {
  try {
    console.log('Document deletion temporarily disabled', { collectionName, documentId });
    return { success: false, error: 'Document deletion temporarily disabled' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Query documents with pagination and caching - temporarily disabled
export const queryDocuments = async (
  collectionName: string,
  constraints: any[] = [], // Changed type to any[] to avoid import errors
  pageSize: number = 10,
  lastDoc?: any // Changed type to any to avoid import errors
) => {
  try {
    console.log('Query operation temporarily disabled', { collectionName, constraints, pageSize, lastDoc });
    return { success: false, error: 'Query operation temporarily disabled' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Count documents with optimized query - temporarily disabled
export const countDocuments = async (
  collectionName: string,
  constraints: any[] = [] // Changed type to any[] to avoid import errors
) => {
  try {
    console.log('Count operation temporarily disabled', { collectionName, constraints });
    return { success: false, error: 'Count operation temporarily disabled' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Clear cache for a specific collection
export const clearCache = (collectionName: string) => {
  for (const key of cache.keys()) {
    if (key.startsWith(collectionName)) {
      cache.delete(key);
    }
  }
};

// Specific queries for DojoPool - temporarily disabled
export const getActiveGames = async (limitCount: number = 10) => {
  console.log('Active games query temporarily disabled');
  return { success: false, error: 'Active games query temporarily disabled' };
};

export const getVenuesByLocation = async (
  location: string,
  limitCount: number = 10
) => {
  console.log('Venues by location query temporarily disabled');
  return { success: false, error: 'Venues by location query temporarily disabled' };
};

export const getUpcomingTournaments = async (limitCount: number = 10) => {
  console.log('Upcoming tournaments query temporarily disabled');
  return { success: false, error: 'Upcoming tournaments query temporarily disabled' };
};
