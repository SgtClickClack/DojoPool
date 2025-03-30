import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  DocumentData,
  QueryConstraint,
  startAt,
  endAt,
  getCountFromServer
} from 'firebase/firestore';
import { db } from './config';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_SIZE = 100; // Maximum number of documents to cache

// In-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();

// Generic CRUD operations with caching
export const createDocument = async (collectionName: string, data: any) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getDocument = async (collectionName: string, documentId: string) => {
  try {
    const cacheKey = `${collectionName}/${documentId}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return { success: true, data: cached.data, fromCache: true };
    }

    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = { id: docSnap.id, ...docSnap.data() };
      cache.set(cacheKey, { data, timestamp: Date.now() });
      return { success: true, data, fromCache: false };
    } else {
      return { success: false, error: 'Document not found' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateDocument = async (collectionName: string, documentId: string, data: any) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteDocument = async (collectionName: string, documentId: string) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Optimized query operations with pagination
export const queryDocuments = async (
  collectionName: string,
  constraints: QueryConstraint[] = [],
  pageSize: number = 10,
  lastDoc?: DocumentData
) => {
  try {
    const cacheKey = `${collectionName}/${JSON.stringify(constraints)}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return { 
        success: true, 
        data: cached.data, 
        fromCache: true,
        hasMore: cached.data.length === pageSize
      };
    }

    let q = query(
      collection(db, collectionName),
      ...constraints,
      limit(pageSize)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    
    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Cache the results
    cache.set(cacheKey, { data: documents, timestamp: Date.now() });
    
    // Clean up old cache entries if needed
    if (cache.size > CACHE_SIZE) {
      const oldestKey = Array.from(cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      cache.delete(oldestKey);
    }

    return { 
      success: true, 
      data: documents,
      fromCache: false,
      hasMore: documents.length === pageSize,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Count documents with optimized query
export const countDocuments = async (
  collectionName: string,
  constraints: QueryConstraint[] = []
) => {
  try {
    const q = query(
      collection(db, collectionName),
      ...constraints
    );
    
    const snapshot = await getCountFromServer(q);
    return { success: true, count: snapshot.data().count };
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

// Specific queries for DojoPool
export const getActiveGames = async (limitCount: number = 10) => {
  return queryDocuments('games', [
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  ], limitCount);
};

export const getVenuesByLocation = async (location: string, limitCount: number = 10) => {
  return queryDocuments('venues', [
    where('location', '==', location),
    orderBy('rating', 'desc')
  ], limitCount);
};

export const getUpcomingTournaments = async (limitCount: number = 10) => {
  return queryDocuments('tournaments', [
    where('status', '==', 'upcoming'),
    orderBy('startDate', 'asc')
  ], limitCount);
}; 