import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCCek3X72_256TKtGrutqPttmc0qY3zF3o",
  authDomain: "choca-8d971.firebaseapp.com",
  projectId: "choca-8d971",
  storageBucket: "choca-8d971.firebasestorage.app",
  messagingSenderId: "486628245227",
  appId: "1:486628245227:web:77b48c43668bfc49d5c8ae",
  measurementId: "G-XSSLCREQMR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber };
