import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
const firebaseConfig = {
  apiKey: "AIzaSyC46XZRlrtFGpol7oubJCkUwuCdOUtxG7I",
  authDomain: "kridana-3ce60.firebaseapp.com",
  projectId: "kridana-3ce60",
  storageBucket: "kridana-3ce60.firebasestorage.app",
  messagingSenderId: "267497181722",
  appId: "1:267497181722:web:0076978660acb927cd37a3",
  measurementId: "G-240DYMGSV7",
};

const app = initializeApp(firebaseConfig);
let analytics = null;

isSupported().then((yes) => {
  if (yes) {
    analytics = getAnalytics(app);
  }
});

export { analytics };
export const auth = getAuth(app);

const secondaryApp = initializeApp(firebaseConfig, "Secondary");
export const secondaryAuth = getAuth(secondaryApp);

export const db = getFirestore(app);
export const storage = getStorage(app);
