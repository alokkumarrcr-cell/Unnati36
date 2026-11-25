import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { type Language, translate, type TranslationKey } from '../lib/i18n.ts';
import type { ProviderRecord, UserPreferences, UserProfile, UserRecord } from '../types.ts';

interface AuthContextValue {
  user: UserRecord | null;
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  provider: ProviderRecord | null;
  loading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    location: string;
    profileType: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [provider, setProvider] = useState<ProviderRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [language, setLanguageState] = useState<Language>('en');

  // Keep session tokens strictly in memory (never localStorage)
  const memoryTokenRef = useRef<string | null>(null);
  const firebaseUserRef = useRef<FirebaseUser | null>(null);

  const getBearerToken = useCallback(async (): Promise<string | null> => {
    if (firebaseUserRef.current) {
      return await firebaseUserRef.current.getIdToken();
    }
    return memoryTokenRef.current;
  }, []);

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = await getBearerToken();
      const headers = new Headers(options.headers || {});
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      return fetch(url, { ...options, headers });
    },
    [getBearerToken]
  );

  const refreshSession = useCallback(async () => {
    const token = await getBearerToken();
    if (!token) {
      setUser(null);
      setProfile(null);
      setPreferences(null);
      setProvider(null);
      setLoading(false);
      return;
    }

    try {
      const res = await authFetch('/api/auth/session');
      if (!res.ok) {
        setUser(null);
        setProfile(null);
        setPreferences(null);
        setProvider(null);
      } else {
        const data = await res.json();
        setUser(data.user);
        setProfile(data.profile);
        setPreferences(data.preferences);
        setProvider(data.provider);
        if (data.user?.preferredLanguage === 'kn') {
          setLanguageState('kn');
        }
      }
    } catch {
      // Ignore transient network failures
    } finally {
      setLoading(false);
    }
  }, [authFetch, getBearerToken]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      firebaseUserRef.current = fbUser;
      if (fbUser) {
        memoryTokenRef.current = null;
        await refreshSession();
      } else if (!memoryTokenRef.current) {
        setUser(null);
        setProfile(null);
        setPreferences(null);
        setProvider(null);
        setLoading(false);
      }
    });
    return () => unsub();
  }, [refreshSession]);

  const loginWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleAuthProvider);
    firebaseUserRef.current = cred.user;
    memoryTokenRef.current = null;
    await refreshSession();
  }, [refreshSession]);

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sign-in failed.');
      firebaseUserRef.current = null;
      memoryTokenRef.current = data.token;
      await refreshSession();
    },
    [refreshSession]
  );

  const registerWithEmail = useCallback(
    async (payload: {
      name: string;
      email: string;
      phone: string;
      password: string;
      location: string;
      profileType: string;
    }) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed.');
      firebaseUserRef.current = null;
      memoryTokenRef.current = data.token;
      await refreshSession();
    },
    [refreshSession]
  );

  const logout = useCallback(async () => {
    memoryTokenRef.current = null;
    if (firebaseUserRef.current) {
      await signOut(auth);
      firebaseUserRef.current = null;
    }
    setUser(null);
    setProfile(null);
    setPreferences(null);
    setProvider(null);
  }, []);

  const setLanguage = useCallback(
    (lang: Language) => {
      setLanguageState(lang);
      if (user) {
        authFetch('/api/user/profile', {
          method: 'PUT',
          body: JSON.stringify({ preferredLanguage: lang }),
        }).catch(() => {});
      }
    },
    [user, authFetch]
  );

  const t = useCallback((key: TranslationKey) => translate(language, key), [language]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        preferences,
        provider,
        loading,
        language,
        setLanguage,
        t,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        refreshSession,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
