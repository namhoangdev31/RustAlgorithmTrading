import { createStore } from "zustand/vanilla";

export type SessionState = {
  userId: string | null;
  email: string | null;
  displayName: string | null;
  provider: string | null;
};

export type SessionActions = {
  setSession: (session: Partial<SessionState>) => void;
  clearSession: () => void;
};

export type SessionStore = SessionState & SessionActions;

export const defaultSessionState: SessionState = {
  userId: null,
  email: null,
  displayName: null,
  provider: null,
};

export function createSessionStore(initialState: Partial<SessionState> = {}) {
  return createStore<SessionStore>()((set) => ({
    ...defaultSessionState,
    ...initialState,
    setSession: (session) => set(session),
    clearSession: () => set(defaultSessionState),
  }));
}
