import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBa6zWLCO_RGhPqnnLvjk5ITvjkVkI4LJg",
  authDomain: "western-school-and-college.firebaseapp.com",
  projectId: "western-school-and-college",
  storageBucket: "western-school-and-college.firebasestorage.app",
  messagingSenderId: "329312876875",
  appId: "1:329312876875:web:a932df395e4ba4608bd0ce"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);