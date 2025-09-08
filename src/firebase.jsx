import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
apiKey: "AIzaSyCQpkX-CbV1dVP4zwclcscm8-Ye3poBXTY",
  authDomain: "mahindra-sri-crackers.firebaseapp.com",
  projectId: "mahindra-sri-crackers",
  storageBucket: "mahindra-sri-crackers.firebasestorage.app",
  messagingSenderId: "99186282854",
  appId: "1:99186282854:web:286921646c9a653aa638a7",
  measurementId: "G-RRCGHWHJXL"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);
const auth = getAuth(app); // Initialize Firebase Auth

export { app, database, storage, auth }; // Export auth for use in LoginForm