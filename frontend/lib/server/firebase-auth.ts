import { firebaseConfig } from "@/firebase/config";

const FIREBASE_AUTH_BASE_URL = "https://identitytoolkit.googleapis.com/v1";

export type FirebaseAuthUser = {
  localId: string;
  email?: string;
  displayName?: string;
  idToken?: string;
  providerId?: string;
};

type FirebaseErrorResponse = {
  error?: {
    message?: string;
  };
};

export class FirebaseAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FirebaseAuthError";
  }
}

function getFirebaseApiKey() {
  const apiKey =
    process.env.FIREBASE_API_KEY ??
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    firebaseConfig.apiKey;

  if (!apiKey) {
    throw new FirebaseAuthError("Missing Firebase API key");
  }

  return apiKey;
}

function mapFirebaseError(message?: string) {
  switch (message) {
    case "EMAIL_EXISTS":
      return "Email is already registered.";
    case "EMAIL_NOT_FOUND":
    case "INVALID_LOGIN_CREDENTIALS":
    case "INVALID_PASSWORD":
      return "Invalid email or password.";
    case "INVALID_EMAIL":
      return "Invalid email address.";
    case "MISSING_PASSWORD":
      return "Password is required.";
    case "WEAK_PASSWORD : Password should be at least 6 characters":
      return "Password must be at least 6 characters.";
    case "INVALID_OOB_CODE":
    case "EXPIRED_OOB_CODE":
      return "Password reset link is invalid or expired.";
    default:
      return message?.replaceAll("_", " ").toLowerCase() || "Firebase authentication failed.";
  }
}

async function firebaseRequest<T>(method: string, body: Record<string, unknown>) {
  const response = await fetch(
    `${FIREBASE_AUTH_BASE_URL}/${method}?key=${getFirebaseApiKey()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  const payload = (await response.json()) as T & FirebaseErrorResponse;

  if (!response.ok) {
    throw new FirebaseAuthError(mapFirebaseError(payload.error?.message));
  }

  return payload;
}

export async function signInFirebaseWithPassword(email: string, password: string) {
  return firebaseRequest<FirebaseAuthUser>("accounts:signInWithPassword", {
    email,
    password,
    returnSecureToken: true,
  });
}

export async function createFirebaseUserWithPassword(
  email: string,
  password: string,
  displayName?: string
) {
  const created = await firebaseRequest<FirebaseAuthUser>("accounts:signUp", {
    email,
    password,
    returnSecureToken: true,
  });

  if (displayName && created.idToken) {
    const updated = await firebaseRequest<FirebaseAuthUser>("accounts:update", {
      idToken: created.idToken,
      displayName,
      returnSecureToken: true,
    });

    return {
      ...created,
      ...updated,
      displayName,
    };
  }

  return {
    ...created,
    displayName,
  };
}

export async function lookupFirebaseUser(idToken: string) {
  const response = await firebaseRequest<{ users?: FirebaseAuthUser[] }>("accounts:lookup", {
    idToken,
  });

  const user = response.users?.[0];
  if (!user) {
    throw new FirebaseAuthError("Invalid Firebase session.");
  }

  return {
    ...user,
    idToken,
    providerId: user.providerId ?? "firebase",
  };
}

export async function sendFirebasePasswordReset(email: string) {
  await firebaseRequest("accounts:sendOobCode", {
    requestType: "PASSWORD_RESET",
    email,
  });
}

export async function confirmFirebasePasswordReset(oobCode: string, newPassword: string) {
  await firebaseRequest("accounts:resetPassword", {
    oobCode,
    newPassword,
  });
}
