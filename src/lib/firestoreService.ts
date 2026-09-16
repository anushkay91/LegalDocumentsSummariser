import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { LegalDocument } from '../types';

/**
 * Clean ID to ensure safety with Firestore rules regex ^[a-zA-Z0-9_\-]+$
 */
export function sanitizeFirestoreId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

/**
 * Save or update a document in Firestore under /users/{userId}/documents/{documentId}
 */
export async function saveDocumentToFirestore(userId: string, document: LegalDocument): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    // If user is guest or not signed into Firebase Auth, local storage is used
    return;
  }

  try {
    const docId = sanitizeFirestoreId(document.id);
    const docRef = doc(db, 'users', userId, 'documents', docId);
    
    // Convert complex document object for clean Firestore storage
    await setDoc(docRef, {
      ...document,
      id: docId,
      userId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.warn('Could not sync document to Firestore (continuing with local state):', error);
  }
}

/**
 * Permanently delete a document from Firestore under /users/{userId}/documents/{documentId}
 */
export async function deleteDocumentFromFirestore(userId: string, documentId: string): Promise<boolean> {
  try {
    if (auth.currentUser && auth.currentUser.uid === userId) {
      const docId = sanitizeFirestoreId(documentId);
      const docRef = doc(db, 'users', userId, 'documents', docId);
      await deleteDoc(docRef);
      return true;
    }
  } catch (error) {
    console.warn('Could not delete document from Firestore:', error);
  }
  return false;
}

/**
 * Load all documents for a signed-in user from Firestore
 */
export async function loadUserDocumentsFromFirestore(userId: string): Promise<LegalDocument[] | null> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return null;
  }

  try {
    const collRef = collection(db, 'users', userId, 'documents');
    const q = query(collRef, orderBy('uploadDate', 'desc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const docs: LegalDocument[] = [];
    snapshot.forEach((snap) => {
      const data = snap.data();
      if (data && data.title && data.rawText) {
        docs.push(data as LegalDocument);
      }
    });

    return docs.length > 0 ? docs : null;
  } catch (error) {
    console.warn('Error fetching documents from Firestore:', error);
    return null;
  }
}
