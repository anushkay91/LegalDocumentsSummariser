import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { 
  auth, 
  loginWithGoogle, 
  loginAnonymously, 
  logoutUser, 
  getCurrentIdToken,
  getOrCreateGuestSessionToken
} from '../lib/firebase';

export interface AppUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  isAnonymous: boolean;
}

interface AuthContextType {
  user: User | AppUser | null;
  loading: boolean;
  idToken: string | null;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signInGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const token = await currentUser.getIdToken();
          setIdToken(token);
        } catch (err) {
          console.warn('Failed to get user ID token:', err);
          setIdToken(null);
        }
      } else {
        // If not logged in with Firebase, provide an active guest session
        const guestToken = getOrCreateGuestSessionToken();
        setIdToken(guestToken);
        setUser({
          uid: `guest_${guestToken.slice(-10)}`,
          email: null,
          displayName: 'Guest User',
          isAnonymous: true,
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignInGoogle = async () => {
    setLoading(true);
    try {
      const res = await loginWithGoogle();
      const token = await res.user.getIdToken();
      setUser(res.user);
      setIdToken(token);
    } finally {
      setLoading(false);
    }
  };

  const handleSignInGuest = async () => {
    setLoading(true);
    try {
      const res = await loginAnonymously();
      if (res && res.user) {
        const token = await res.user.getIdToken();
        setUser(res.user);
        setIdToken(token);
      } else {
        // Fallback when anonymous auth is restricted by project console
        const guestToken = getOrCreateGuestSessionToken();
        setIdToken(guestToken);
        setUser({
          uid: `guest_${guestToken.slice(-10)}`,
          email: null,
          displayName: 'Guest User',
          isAnonymous: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await logoutUser();
      const guestToken = getOrCreateGuestSessionToken();
      setIdToken(guestToken);
      setUser({
        uid: `guest_${guestToken.slice(-10)}`,
        email: null,
        displayName: 'Guest User',
        isAnonymous: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchIdToken = async (forceRefresh = false) => {
    const token = await getCurrentIdToken(forceRefresh);
    if (token) setIdToken(token);
    return token;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        idToken,
        isAuthenticated: !!user,
        signInWithGoogle: handleSignInGoogle,
        signInGuest: handleSignInGuest,
        signOut: handleSignOut,
        getIdToken: fetchIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
