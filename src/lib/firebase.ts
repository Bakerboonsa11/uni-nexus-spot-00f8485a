import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDX5C0AMphKGOBW9MOR2w96wKYIr-oHoIs",
  authDomain: "university-hub-6be49.firebaseapp.com",
  projectId: "university-hub-6be49",
  storageBucket: "university-hub-6be49.firebasestorage.app",
  messagingSenderId: "648455540925",
  appId: "1:648455540925:web:236634ceaf5918a8b527d4",
  measurementId: "G-Z7SCPLKL31"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
