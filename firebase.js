// Import fungsi Firebase yang kita butuhkan
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// PASTE FIREBASE CONFIG ANDA DI SINI
const firebaseConfig = {
  apiKey: "AIzaSyBupajx6eWGfbkG8-zSAgdfbGHVmOir9XI",
  authDomain: "harvest-nation-abb3f.firebaseapp.com",
  projectId: "harvest-nation-abb3f",
  storageBucket: "harvest-nation-abb3f.firebasestorage.app",
  messagingSenderId: "49671436845",
  appId: "1:49671436845:web:d4edf43324da06ef0416a4"
};

// Inisialisasi Firebase (Mencegah inisialisasi ganda di Next.js)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Inisialisasi Autentikasi dan Database
export const auth = getAuth(app);
export const db = getFirestore(app);