import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  initGoogleAuth, 
  isAuthenticated as checkAuth, 
  getUserInfo,
  signIn as googleSignIn,
  signOut as googleSignOut,
  addAuthStateListener,
  removeAuthStateListener
} from '../services/authService';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Google認証の初期化
  useEffect(() => {
    const initAuth = async () => {
      try {
        await initGoogleAuth();
        
        // 認証状態を確認
        const authenticated = checkAuth();
        setIsAuthenticated(authenticated);
        
        if (authenticated) {
          setUser(getUserInfo());
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize Google Auth', error);
        setLoading(false);
      }
    };
    
    initAuth();
    
    // 認証状態の変更を監視
    const handleAuthChange = (authenticated) => {
      setIsAuthenticated(authenticated);
      if (authenticated) {
        setUser(getUserInfo());
      } else {
        setUser(null);
      }
    };
    
    addAuthStateListener(handleAuthChange);
    
    return () => {
      removeAuthStateListener(handleAuthChange);
    };
  }, []);

  // ログイン処理
  const signIn = async () => {
    return googleSignIn();
  };

  // ログアウト処理
  const signOut = () => {
    googleSignOut();
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    signIn,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
