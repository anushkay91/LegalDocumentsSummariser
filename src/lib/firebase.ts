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
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function getOrCreateGuestSessionToken(): string {
  try {
    const existing = localStorage.getItem('legallens_guest_token');
    if (existing) return existing;
    const newToken = `guest-session-${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
    localStorage.setItem('legallens_guest_token', newToken);
    return newToken;
  } catch {
    return `guest-session-fallback-${Date.now()}`;
  }
}

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
    if (error?.code === 'auth/admin-restricted-operation' || error?.message?.includes('admin-restricted-operation')) {
      // Firebase Anonymous Authentication provider is disabled in this project's Firebase Console.
      // We seamlessly switch to the client-isolated guest session.
      return null;
    }
    console.warn('Anonymous sign-in encounter:', error);
    return null;
  }
}

export async function logoutUser() {
  try {
    localStorage.removeItem('legallens_guest_token');
  } catch {}
  return await firebaseSignOut(auth);
}

export async function getCurrentIdToken(forceRefresh = false): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      return await currentUser.getIdToken(forceRefresh);
    } catch {
      // Fall through to guest session
    }
  }
  return getOrCreateGuestSessionToken();
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
