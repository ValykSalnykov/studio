
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-uR3RZF9lo8hX0Xc5nZdn3g7Z2syCvFY",
  authDomain: "studio-1696970562-bd013.firebaseapp.com",
  projectId: "studio-1696970562-bd013",
  storageBucket: "studio-1696970562-bd013.appspot.com",
  messagingSenderId: "686547551085",
  appId: "1:686547551085:web:06c802a25f95e22c369064"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
