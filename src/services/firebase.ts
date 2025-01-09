import { initializeApp } from '@firebase/app';
import { getAuth } from '@firebase/auth';
import { getStorage } from '@firebase/storage';
import { enableMultiTabIndexedDbPersistence, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Initialize Firestore with settings for better performance
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  cacheSizeBytes: 50000000, // 50 MB
  ignoreUndefinedProperties: true,
});

// Enable multi-tab persistence
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistence failed to enable');
  } else if (err.code === 'unimplemented') {
    console.warn('Persistence is not available in this browser');
  }
});

export default app;
