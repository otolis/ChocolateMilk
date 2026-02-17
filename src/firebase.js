import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAYMyR77-TqJmUk41Ikyf9DesJH4M8-U8Q",
  authDomain: "chocolatemilk-9dcf9.firebaseapp.com",
  projectId: "chocolatemilk-9dcf9",
  storageBucket: "chocolatemilk-9dcf9.firebasestorage.app",
  messagingSenderId: "66030523339",
  appId: "1:66030523339:web:637fe9f5873d5259da1c4e",
  measurementId: "G-Y9J3XLL99V"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const analytics = getAnalytics(app);
