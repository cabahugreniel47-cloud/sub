import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0162605783",
  appId: "1:1028096798479:web:84619d88ebe0a05607187a",
  apiKey: "AIzaSyDyLTeIpZNz-ThtG5h-fCoOnl1u8MCGonU",
  authDomain: "gen-lang-client-0162605783.firebaseapp.com",
  storageBucket: "gen-lang-client-0162605783.firebasestorage.app",
  messagingSenderId: "1028096798479"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
