import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBUr_bJ_kAtwNaweB4I29YPQ_Zg8_R_1Yg",
  authDomain: "edumn-146bf.firebaseapp.com",
  projectId: "edumn-146bf",
  storageBucket: "edumn-146bf.firebasestorage.app",
  messagingSenderId: "739210902569",
  appId: "1:739210902569:web:e9657e7b986358a2817038",
  measurementId: "G-6LB4T7K54G"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
