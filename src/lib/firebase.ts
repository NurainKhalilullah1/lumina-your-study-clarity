// src/lib/firebase.ts
// Firebase initialization — shared between the app and useNotifications hook.
// All values come from VITE_ env variables (inlined at build time by Vite).

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Prevent duplicate app initialization (e.g. during hot reload)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// getMessaging() is only available in browser environments that support it
export const getFirebaseMessaging = async () => {
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
};

export default app;
