import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './config';

// Generic CRUD operations
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
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
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

// Query operations
export const queryDocuments = async (
  collectionName: string,
  constraints: QueryConstraint[] = [],
  limitCount: number = 10
) => {
  try {
    const q = query(
      collection(db, collectionName),
      ...constraints,
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { success: true, data: documents };
  } catch (error: any) {
    return { success: false, error: error.message };
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