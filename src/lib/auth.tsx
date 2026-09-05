import { createContext, useContext, useMemo, ReactNode } from 'react';
import type { User, Profile, ContactDetails } from './types';
import { useDb, getSessionUserId } from './db';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  contacts: ContactDetails | null;
}

const AuthCtx = createContext<AuthState>({ user: null, profile: null, contacts: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const db = useDb();
  const value = useMemo<AuthState>(() => {
    const userId = getSessionUserId();
    if (!userId) return { user: null, profile: null, contacts: null };
    const user = db.users.find((u) => u.id === userId) || null;
    const profile = user ? db.profiles.find((p) => p.userId === user.id) || null : null;
    const contacts = profile ? db.contacts.find((c) => c.profileId === profile.id) || null : null;
    return { user, profile, contacts };
  }, [db]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthCtx);
}
