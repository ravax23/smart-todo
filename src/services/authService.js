import { jwtDecode } from 'jwt-decode';

// Google OAuth認証のためのクライアントID
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// 必要なスコープ
const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events';

// ローカルストレージのキー
const TOKEN_KEY = 'google_auth_token';
const USER_KEY = 'google_user_info';

/**
 * Google認証の初期化
 */
export const initGoogleAuth = () => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      resolve();
    };
    script.onerror = (error) => {
      reject(new Error('Google API script failed to load'));
    };
    document.body.appendChild(script);
  });
};

/**
 * 認証レスポンスのハンドラ
 */
const handleCredentialResponse = (response) => {
  if (response.credential) {
    // JWTをデコードしてユーザー情報を取得
    const userObject = jwtDecode(response.credential);
    
    // トークンとユーザー情報を保存
    localStorage.setItem(TOKEN_KEY, response.credential);
    localStorage.setItem(USER_KEY, JSON.stringify(userObject));
    
    // カスタムイベントを発行して認証状態の変更を通知
    const event = new CustomEvent('googleAuthStateChanged', { detail: { isAuthenticated: true } });
    window.dispatchEvent(event);
    
    return userObject;
  }
  return null;
};

/**
 * ログイン処理
 */
export const signIn = () => {
  if (window.google && window.google.accounts && window.google.accounts.id) {
    window.google.accounts.id.prompt();
    return true;
  }
  return false;
};

/**
 * ログアウト処理
 */
export const signOut = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  
  // カスタムイベントを発行して認証状態の変更を通知
  const event = new CustomEvent('googleAuthStateChanged', { detail: { isAuthenticated: false } });
  window.dispatchEvent(event);
  
  return true;
};

/**
 * 認証状態の確認
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;
  
  try {
    // トークンの有効期限をチェック
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    if (decoded.exp < currentTime) {
      // トークンの期限切れ
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Invalid token', error);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return false;
  }
};

/**
 * ユーザー情報の取得
 */
export const getUserInfo = () => {
  const userInfo = localStorage.getItem(USER_KEY);
  if (!userInfo) return null;
  
  try {
    return JSON.parse(userInfo);
  } catch (error) {
    console.error('Invalid user info', error);
    return null;
  }
};

/**
 * アクセストークンの取得
 */
export const getAccessToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * 認証状態の変更を監視するリスナーを追加
 */
export const addAuthStateListener = (callback) => {
  window.addEventListener('googleAuthStateChanged', (event) => {
    callback(event.detail.isAuthenticated);
  });
};

/**
 * 認証状態の変更を監視するリスナーを削除
 */
export const removeAuthStateListener = (callback) => {
  window.removeEventListener('googleAuthStateChanged', callback);
};
