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
        
        // モバイル環境を検出
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        console.log('Device detection in AuthContext:', isMobile ? 'Mobile' : 'Desktop');
        
        // デバイス情報をログに記録
        const deviceInfo = {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          cookieEnabled: navigator.cookieEnabled,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
          pixelRatio: window.devicePixelRatio || 1
        };
        console.log('Device info in AuthContext:', deviceInfo);
        
        // URLからアクセストークンを確認（OAuth 2.0リダイレクト後）
        const hash = window.location.hash;
        if (hash && hash.includes('access_token=')) {
          try {
            const accessToken = hash.match(/access_token=([^&]*)/)[1];
            if (accessToken) {
              console.log('Got access token from URL hash during init');
              
              try {
                localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
                console.log('Access token saved to localStorage in AuthContext');
              } catch (storageError) {
                console.error('Error saving to localStorage in AuthContext:', storageError);
              }
              
              try {
                // セッションストレージにもバックアップ（iOSのプライベートブラウジングモード対策）
                sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
                console.log('Access token saved to sessionStorage in AuthContext');
              } catch (storageError) {
                console.error('Error saving to sessionStorage in AuthContext:', storageError);
              }
              
              try {
                // Cookieにも保存（サードパーティCookie制限の回避策）
                document.cookie = `${ACCESS_TOKEN_KEY}=${accessToken}; path=/; max-age=3600; SameSite=Strict`;
                console.log('Access token saved to cookie in AuthContext');
              } catch (cookieError) {
                console.error('Error saving to cookie in AuthContext:', cookieError);
              }
              
              // URLからハッシュを削除
              try {
                window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
                console.log('URL hash cleared in AuthContext');
              } catch (historyError) {
                console.error('Error updating history in AuthContext:', historyError);
              }
              
              setIsAuthenticated(true);
              // ユーザー情報は後で取得する必要があるかもしれない
              setLoading(false);
              return;
            }
          } catch (parseError) {
            console.error('Error parsing access token in AuthContext:', parseError);
          }
        }
        
        // 認証状態を確認
        const authenticated = checkAuth();
        console.log('Authentication check result:', authenticated);
        setIsAuthenticated(authenticated);
        
        if (authenticated) {
          const userInfo = getUserInfo();
          console.log('User info retrieved:', userInfo ? 'success' : 'null');
          setUser(userInfo);
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
