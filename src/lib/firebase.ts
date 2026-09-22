import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD92P6ubxSkxm5Dv1G0wlDK196alU7lnxs",
  authDomain: "jamiisound.firebaseapp.com",
  projectId: "jamiisound",
  storageBucket: "jamiisound.firebasestorage.app",
  messagingSenderId: "647838428215",
  appId: "1:647838428215:android:5a4d6f1cb0af3faa5723b2"
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
