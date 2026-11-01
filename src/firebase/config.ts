import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { createAsyncStorage } from "@react-native-async-storage/async-storage";

// The public "firebase/auth" entry point's types don't surface
// getReactNativePersistence for this platform, even though the underlying
// @firebase/auth package ships a React Native build that exports it (Metro
// resolves it correctly at runtime via package export conditions). Pulling
// it in through require keeps that runtime behavior without fighting the
// type resolution mismatch.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getReactNativePersistence } = require("@firebase/auth");

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn(
    "Firebase config is missing. Copy .env.example to .env and fill in your Firebase project values."
  );
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const authStorage = createAsyncStorage("listmaster-auth");

// initializeAuth throws if it already ran for this app (e.g. Fast Refresh) — fall back to getAuth.
let authInstance;
try {
  authInstance = initializeAuth(app, { persistence: getReactNativePersistence(authStorage) });
} catch {
  authInstance = getAuth(app);
}
export const auth = authInstance;

export const db = initializeFirestore(app, {});

export default app;
