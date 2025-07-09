// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC6_zmANFhzPVFQjO6-BPw3yI2C7C1Fn28",
  authDomain: "blogcanhan-907af.firebaseapp.com",
  projectId: "blogcanhan-907af",
  storageBucket: "blogcanhan-907af.appspot.com",
  messagingSenderId: "693586712162",
  appId: "1:693586712162:web:e362d95b4099fe1e6d633b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the database service
const db = getFirestore(app);

// Get a reference to the auth service
const auth = getAuth(app);

// SỬA LỖI: Thêm dòng export này để các file khác có thể sử dụng db và auth
export { db, auth };
