import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDZdhQvbv1sFKS1025L3O7i2pn1_NQDZy8",
    authDomain: "projectmanagments-46041.firebaseapp.com",
    databaseURL: "https://projectmanagments-46041-default-rtdb.firebaseio.com",
    projectId: "projectmanagments-46041",
    storageBucket: "projectmanagments-46041.firebasestorage.app",
    messagingSenderId: "336753450154",
    appId: "1:336753450154:web:073bfddfa48b5de29084d3",
    measurementId: "G-YD6R4L99W7"
  };

const app = initializeApp(firebaseConfig);
console.log(app);
export const auth = getAuth(app);
export const db = getFirestore(app);