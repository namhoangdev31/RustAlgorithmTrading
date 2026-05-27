"use server";

import { AuthError } from "next-auth";
import { redirect, localizedHref } from "@/i18n/navigation";

import {
  FirebaseAuthError,
  confirmFirebasePasswordReset,
  createFirebaseUserWithPassword,
  sendFirebasePasswordReset,
} from "@/lib/server/firebase-auth";
import { signIn, signOut } from "@/lib/server/auth";

const oauthProviders = new Set(["google", "github", "apple"]);

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function redirectWithMessage(path: string, key: "error" | "info", message: string) {
  const localized = await localizedHref(path);
  redirect(`${localized}?${key}=${encodeURIComponent(message)}`);
}

export async function loginWithEmailAction(formData: FormData) {
  const email = readFormValue(formData, "email").toLowerCase();
  const password = readFormValue(formData, "password");

  if (!email || !password) {
    await redirectWithMessage("/login", "error", "Email and password are required.");
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: await localizedHref("/dashboard"),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      await redirectWithMessage("/login", "error", "Invalid email or password.");
    }

    throw error;
  }
}

export async function loginWithFirebaseIdTokenAction(idToken: string) {
  if (!idToken) {
    await redirectWithMessage("/login", "error", "Firebase social login did not return a token.");
  }

  try {
    await signIn("credentials", {
      idToken,
      redirectTo: await localizedHref("/dashboard"),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      await redirectWithMessage("/login", "error", "Firebase social login failed.");
    }

    throw error;
  }
}

export async function loginWithOAuthAction(formData: FormData) {
  const provider = readFormValue(formData, "provider").toLowerCase();

  if (!oauthProviders.has(provider)) {
    await redirectWithMessage("/login", "error", "Unsupported social login provider.");
  }

  try {
    await signIn(provider, {
      redirectTo: await localizedHref("/dashboard"),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      await redirectWithMessage("/login", "error", "Social login failed.");
    }

    throw error;
  }
}

export async function registerWithEmailAction(formData: FormData) {
  const name = readFormValue(formData, "name");
  const email = readFormValue(formData, "email").toLowerCase();
  const password = readFormValue(formData, "password");

  if (!name || !email || !password) {
    await redirectWithMessage("/register", "error", "Name, email, and password are required.");
  }

  if (password.length < 6) {
    await redirectWithMessage("/register", "error", "Password must be at least 6 characters.");
  }

  try {
    const firebaseUser = await createFirebaseUserWithPassword(email, password, name);

    await signIn("credentials", {
      idToken: firebaseUser.idToken,
      redirectTo: await localizedHref("/dashboard"),
    });
  } catch (error) {
    if (error instanceof AuthError || error instanceof FirebaseAuthError) {
      await redirectWithMessage("/register", "error", error.message || "Registration failed.");
    }

    throw error;
  }
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = readFormValue(formData, "resetEmail").toLowerCase();

  if (!email) {
    await redirectWithMessage("/login", "error", "Enter your email before requesting a reset.");
  }

  try {
    await sendFirebasePasswordReset(email);
    await redirectWithMessage("/login", "info", "Password reset email sent.");
  } catch (error) {
    if (error instanceof FirebaseAuthError) {
      await redirectWithMessage("/login", "error", error.message);
    }

    throw error;
  }
}

export async function confirmPasswordResetAction(formData: FormData) {
  const oobCode = readFormValue(formData, "oobCode");
  const password = readFormValue(formData, "password");
  const confirm = readFormValue(formData, "confirm");

  if (!oobCode) {
    await redirectWithMessage("/login", "error", "Password reset code is missing.");
  }

  if (password.length < 6) {
    await redirectWithMessage("/login", "error", "Password must be at least 6 characters.");
  }

  if (password !== confirm) {
    await redirectWithMessage("/login", "error", "Passwords do not match.");
  }

  try {
    await confirmFirebasePasswordReset(oobCode, password);
    await redirectWithMessage("/login", "info", "Password updated. You can sign in now.");
  } catch (error) {
    if (error instanceof FirebaseAuthError) {
      await redirectWithMessage("/login", "error", error.message);
    }

    throw error;
  }
}

export async function logoutAction() {
  await signOut({
    redirectTo: await localizedHref("/login"),
  });
}
