// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-PC5EHbi8ED1BteBVTmMoLIIjBfmRlB8",
  authDomain: "login-auth-2f24a.firebaseapp.com",
  projectId: "login-auth-2f24a",
  storageBucket: "login-auth-2f24a.firebasestorage.app",
  messagingSenderId: "785058930699",
  appId: "1:785058930699:web:5a05d5053496e07547670e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;
export const googleProvider = new GoogleAuthProvider();

// Function to send password reset email
export const sendPasswordReset = (email: string) => {
  return sendPasswordResetEmail(auth, email)
    .then(() => {
      // Password reset email sent!
      // ..
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      // ..
      throw error; // Re-throw to allow calling code to handle it
    });
};