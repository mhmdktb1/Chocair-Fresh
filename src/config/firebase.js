// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA9IQ54C85oN7W0tsu0vApXGMqHTrqK", 
  authDomain: "chocair-fresh.firebaseapp.com",
  projectId: "chocair-fresh",
  storageBucket: "chocair-fresh.appspot.com",
  messagingSenderId: "787094685309",
  appId: "1:787094685309:web:3bcf0eb4842409938f9a9a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup };
