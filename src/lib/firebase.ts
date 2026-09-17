import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const storage = getStorage(app, firebaseConfig.storageBucket || undefined);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function loginWithGoogle() {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.warn('Google popup sign-in failed or closed:', error);
    throw error;
  }
}

export async function loginAnonymously() {
  try {
    return await signInAnonymously(auth);
  } catch (error: any) {
    console.warn('Anonymous sign-in encounter:', error);
    return null;
  }
}

export async function logoutUser() {
  return await firebaseSignOut(auth);
}

/**
 * Returns real cryptographically signed Firebase ID token.
 */
export async function getCurrentIdToken(forceRefresh = false): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      return await currentUser.getIdToken(forceRefresh);
    } catch (e) {
      console.warn('Failed to retrieve Firebase ID token:', e);
    }
  }
  return null;
}

/**
 * Uploads a document file to the user's private storage path:
 * users/{uid}/documents/{documentId}/original
 */
export async function uploadPrivateDocumentFile(
  userId: string,
  documentId: string,
  fileBlob: Blob | File
): Promise<string> {
  const path = `users/${userId}/documents/${documentId}/original`;
  const fileRef = storageRef(storage, path);
  await uploadBytes(fileRef, fileBlob);
  return path;
}

// Connection check as mandated by Firebase integration guidelines
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Firestore client offline. Check Firebase network configuration.');
    }
  }
}

testFirestoreConnection();

export default app;
