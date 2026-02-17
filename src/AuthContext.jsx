import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signInWithRedirect,
  signOut,
  GoogleAuthProvider
} from 'firebase/auth';
import { app } from './firebase';

const AuthContext = createContext(null);

const EMAIL_TO_NAME = {
  'lagonikasa@gmail.com': 'Tolis',
  'giannisergaz@gmail.com': 'Giannis',
};

const ALLOWED_EDITORS = Object.keys(EMAIL_TO_NAME);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const login = () => signInWithRedirect(auth, new GoogleAuthProvider());
  const logout = () => signOut(auth);

  const isEditor = user && ALLOWED_EDITORS.includes(user.email);
  const displayName = user ? (EMAIL_TO_NAME[user.email] || user.displayName || 'Guest') : null;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isEditor, displayName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
