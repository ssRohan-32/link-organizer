// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB2f5gSg9cAZG77GBNyV0b-urGb7FldqIk",
  authDomain: "link-storage-authentication.firebaseapp.com",
  projectId: "link-storage-authentication",
  storageBucket: "link-storage-authentication.firebasestorage.app",
  messagingSenderId: "878658335577",
  appId: "1:878658335577:web:41d9ce9e669c49364dd248"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export { firebaseApp, auth, db };