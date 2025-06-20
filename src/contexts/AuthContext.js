import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  initGoogleAuth, 
  isAuthenticated as checkAuth, 
  getUserInfo,
  signIn as googleSignIn,
  signOut as googleSignOut,
  addAuthStateListener,
  removeAuthStateListener,
  getAccessToken
} from '../services/authService';

const AuthContext = createContext();
const ACCESS_TOKEN_KEY = 'google_access_token';

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
        
        // URLからアクセストークンを確認（OAuth 2.0リダイレクト後）
        const hash = window.location.hash;
        if (hash && hash.includes('access_token=')) {
          const accessToken = hash.match(/access_token=([^&]*)/)[1];
          if (accessToken) {
            console.log('Got access token from URL hash during init');
            localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
            
            // URLからハッシュを削除
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
            
            setIsAuthenticated(true);
            // ユーザー情報は後で取得する必要があるかもしれない
            setLoading(false);
            return;
          }
        }
        
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
