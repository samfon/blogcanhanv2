// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration - PROJECT MỚI
const firebaseConfig = {
  apiKey: "your-new-api-key",
  authDomain: "samfon-337.firebaseapp.com",
  projectId: "samfon-337",  // Project ID mới
  storageBucket: "samfon-337.appspot.com",
  messagingSenderId: "your-new-sender-id",
  appId: "your-new-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
