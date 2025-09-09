import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
 apiKey: "AIzaSyCTYWrF20kn1_SDsYrtDQir0GkUbQ19_xQ",
  authDomain: "udhayamcracker.firebaseapp.com",
  databaseURL: "https://udhayamcracker-default-rtdb.firebaseio.com",
  projectId: "udhayamcracker",
  storageBucket: "udhayamcracker.appspot.com",
  messagingSenderId: "988190074194",
  appId: "1:988190074194:web:062dc413ed31ea0999068b",
  measurementId: "G-XHNE1RW2Y8"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);
const auth = getAuth(app); // Initialize Firebase Auth

export { app, database, storage, auth }; // Export auth for use in LoginForm