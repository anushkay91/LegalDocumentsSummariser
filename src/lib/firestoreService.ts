import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  orderBy,
  onSnapshot,
  Unsubscribe 
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
    return;
  }

  try {
    const docId = sanitizeFirestoreId(document.id);
    const docRef = doc(db, 'users', userId, 'documents', docId);
    
    await setDoc(docRef, {
      ...document,
      id: docId,
      userId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.warn('Could not sync document to Firestore:', error);
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
 * Real-time listener for user documents from Firestore (Phase 5: Real-time Firestore listeners)
 */
export function subscribeToUserDocuments(
  userId: string,
  onDocuments: (docs: LegalDocument[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const collRef = collection(db, 'users', userId, 'documents');
  const q = query(collRef, orderBy('uploadDate', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const docs: LegalDocument[] = [];
      snapshot.forEach((snap) => {
        const data = snap.data();
        if (data && data.title) {
          docs.push(data as LegalDocument);
        }
      });
      onDocuments(docs);
    },
    (err) => {
      console.warn('Firestore subscription notice:', err.message);
      if (onError) onError(err);
    }
  );
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
      if (data && data.title) {
        docs.push(data as LegalDocument);
      }
    });

    return docs.length > 0 ? docs : null;
  } catch (error) {
    console.warn('Error fetching documents from Firestore:', error);
    return null;
  }
}
