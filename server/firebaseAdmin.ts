import { App, getApps, getApp, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

let firebaseApp: App | null = null;

export function getFirebaseAdminApp(): App {
  if (firebaseApp) return firebaseApp;

  const currentApps = getApps();
  if (currentApps.length > 0 && currentApps[0]) {
    firebaseApp = currentApps[0];
    return firebaseApp;
  }

  let projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'genai3-506610';
  let storageBucket = 'genai3-506610.firebasestorage.app';

  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.projectId) projectId = config.projectId;
      if (config.storageBucket) storageBucket = config.storageBucket;
    }
  } catch (e) {
    console.warn('Could not read firebase-applet-config.json for Firebase Admin:', e);
  }

  try {
    firebaseApp = initializeApp({
      projectId,
      storageBucket,
    });
  } catch (error) {
    const fallbackApps = getApps();
    if (fallbackApps.length > 0 && fallbackApps[0]) {
      firebaseApp = fallbackApps[0];
    } else {
      firebaseApp = initializeApp({ projectId });
    }
  }

  return firebaseApp;
}

export const adminAuth = () => getAuth(getFirebaseAdminApp());
export const adminFirestore = () => getFirestore(getFirebaseAdminApp());
export const adminStorage = () => getStorage(getFirebaseAdminApp());
