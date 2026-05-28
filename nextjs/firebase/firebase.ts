import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GithubAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";

import { firebaseConfig } from "@/firebase/config";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");

export const githubProvider = new GithubAuthProvider();
githubProvider.addScope("read:user");
githubProvider.addScope("user:email");

export const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");

export const sendPasswordReset = (email: string) => {
  return sendPasswordResetEmail(auth, email)
    .then(() => {
      return;
    })
    .catch((error) => {
      throw error;
    });
};
