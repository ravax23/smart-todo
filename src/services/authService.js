import { jwtDecode } from 'jwt-decode';
import { gapi } from 'gapi-script';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
// Tasks APIのスコープ
const SCOPES = 'https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/tasks.readonly';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest'];

// ローカルストレージのキー
const TOKEN_KEY = 'google_auth_token';
const ACCESS_TOKEN_KEY = 'google_access_token';
const USER_KEY = 'google_user_info';

// Google Identity Services (GIS) の初期化
export const initGoogleAuth = () => {
  return new Promise((resolve, reject) => {
    if (!CLIENT_ID) {
      reject(new Error('Google Client ID is not configured'));
      return;
    }

    // すでにスクリプトが読み込まれているか確認
    if (window.google && window.google.accounts && window.google.accounts.id) {
      initializeGoogleAuth(resolve, reject);
      return;
    }

    // GISの初期化（ログインボタン用）
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      try {
        initializeGoogleAuth(resolve, reject);
        
        // カスタムイベントを発火してボタンのレンダリングを通知
        const event = new CustomEvent('google-loaded');
        window.dispatchEvent(event);
      } catch (error) {
        reject(error);
      }
    };
    script.onerror = () => {
      reject(new Error('Google API script failed to load'));
    };
    document.body.appendChild(script);
  });
};

// Google Identity Servicesの初期化関数
const initializeGoogleAuth = (resolve, reject) => {
  try {
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    
    // GAPI（Google API Client）の初期化
    initGapiClient().then(() => {
      resolve();
    }).catch(error => {
      console.error('Failed to initialize GAPI client:', error);
      // GISの初期化は成功したとみなす
      resolve();
    });
  } catch (error) {
    reject(error);
  }
};

// GAPI（Google API Client）の初期化
const initGapiClient = () => {
  return new Promise((resolve, reject) => {
    try {
      // GAPIスクリプトの読み込み
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.async = true;
      gapiScript.defer = true;
      gapiScript.onload = () => {
        gapi.load('client', async () => {
          try {
            await gapi.client.init({
              apiKey: API_KEY,
              discoveryDocs: DISCOVERY_DOCS,
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      };
      gapiScript.onerror = () => {
        reject(new Error('GAPI script failed to load'));
      };
      document.body.appendChild(gapiScript);
    } catch (error) {
      reject(error);
    }
  });
};

// Google認証レスポンスのハンドラー
const handleCredentialResponse = (response) => {
  if (response && response.credential) {
    try {
      // JWTをデコード
      const decodedToken = jwtDecode(response.credential);
      
      // トークンとユーザー情報を保存
      localStorage.setItem(TOKEN_KEY, response.credential);
      localStorage.setItem(USER_KEY, JSON.stringify({
        id: decodedToken.sub,
        name: decodedToken.name,
        email: decodedToken.email,
        picture: decodedToken.picture
      }));
      
      // アクセストークンとしてもJWTを保存（Tasks APIで使用するため）
      localStorage.setItem(ACCESS_TOKEN_KEY, response.credential);
      sessionStorage.setItem(ACCESS_TOKEN_KEY, response.credential);
      console.log('JWT token saved as access token');
      
      // 認証状態変更イベントを発火
      const event = new CustomEvent('googleAuthStateChanged', { 
        detail: { isAuthenticated: true } 
      });
      window.dispatchEvent(event);
      
      // ページをリロード
      window.location.reload();
    } catch (error) {
      console.error('Error processing credential response:', error);
    }
  }
};

// 認証状態のチェック
export const isAuthenticated = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
    
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        // トークンの有効期限をチェック
        if (decodedToken.exp && decodedToken.exp > currentTime) {
          return true;
        }
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }
    
    // アクセストークンがある場合も認証済みとみなす
    if (accessToken) {
      return true;
    }
    
    return false;
  } catch (e) {
    console.error('Error checking authentication status:', e);
    return false;
  }
};

// ユーザー情報の取得
export const getUserInfo = () => {
  try {
    const userInfo = localStorage.getItem(USER_KEY);
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (e) {
    console.error('Error getting user info:', e);
    return null;
  }
};

// サインイン
export const signIn = () => {
  try {
    // リダイレクトURI（現在のページのURL）
    const redirectUri = window.location.origin;
    
    // OAuth 2.0認証URLを構築
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(SCOPES)}&prompt=consent`;
    
    // 認証ページにリダイレクト
    window.location.href = authUrl;
  } catch (error) {
    console.error('Error during sign in:', error);
    throw error;
  }
};

// サインアウト
export const signOut = () => {
  try {
    // ローカルストレージからトークンとユーザー情報を削除
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    
    // セッションストレージからも削除
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    
    // Google Identity Servicesのサインアウト
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.disableAutoSelect();
    }
    
    // 認証状態変更イベントを発火
    const event = new CustomEvent('googleAuthStateChanged', { 
      detail: { isAuthenticated: false } 
    });
    window.dispatchEvent(event);
    
    // ページをリロード
    window.location.reload();
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};

// 認証状態変更リスナーの追加
export const addAuthStateListener = (callback) => {
  window.addEventListener('googleAuthStateChanged', (event) => {
    callback(event.detail.isAuthenticated);
  });
};

// 認証状態変更リスナーの削除
export const removeAuthStateListener = (callback) => {
  window.removeEventListener('googleAuthStateChanged', callback);
};

// アクセストークンの取得
export const getAccessToken = () => {
  try {
    // URLハッシュからアクセストークンを取得
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      const accessToken = hash.match(/access_token=([^&]*)/)[1];
      if (accessToken) {
        // アクセストークンをローカルストレージに保存
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        console.log('Access token saved from URL hash');
        
        // URLハッシュをクリア
        window.history.replaceState(null, null, window.location.pathname);
        
        return accessToken;
      }
    }
    
    // ローカルストレージからアクセストークンを取得
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
    return accessToken;
  } catch (e) {
    console.error('Error getting access token:', e);
    return null;
  }
};
// 明示的なスコープ承認を要求
export const requestTasksScope = async () => {
  try {
    console.log('Requesting tasks scope explicitly');
    
    // 現在のアクセストークンを取得
    const currentToken = getAccessToken();
    if (!currentToken) {
      console.error('No access token available');
      return false;
    }
    
    // 強制的に再認証を行う
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    
    // Google OAuth 2.0認証ページにリダイレクト
    const redirectUri = window.location.origin;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(SCOPES)}&prompt=consent`;
    
    console.log('Redirecting to auth URL:', authUrl);
    window.location.href = authUrl;
    
    return true;
  } catch (error) {
    console.error('Failed to request tasks scope:', error);
    return false;
  }
};
