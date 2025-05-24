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

    // GISの初期化（ログインボタン用）
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
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
    script.onerror = () => {
      reject(new Error('Google API script failed to load'));
    };
    document.body.appendChild(script);
  });
};

// GAPI（Google API Client）の初期化
const initGapiClient = () => {
  return new Promise((resolve, reject) => {
    if (!window.gapi) {
      console.log('Loading GAPI script...');
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        loadGapiClient().then(resolve).catch(reject);
      };
      script.onerror = () => {
        reject(new Error('GAPI script failed to load'));
      };
      document.body.appendChild(script);
    } else {
      loadGapiClient().then(resolve).catch(reject);
    }
  });
};

// GAPIクライアントの読み込み
const loadGapiClient = () => {
  return new Promise((resolve, reject) => {
    window.gapi.load('client:auth2', () => {
      window.gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        scope: SCOPES,
        discoveryDocs: DISCOVERY_DOCS
      }).then(() => {
        console.log('GAPI client initialized');
        resolve();
      }).catch(error => {
        console.error('Error initializing GAPI client:', error);
        reject(error);
      });
    });
  });
};

// GISの認証レスポンス処理
const handleCredentialResponse = (response) => {
  if (response.credential) {
    try {
      const userObject = jwtDecode(response.credential);
      localStorage.setItem(TOKEN_KEY, response.credential);
      localStorage.setItem(USER_KEY, JSON.stringify(userObject));
      
      // GAPIクライアントを使用してアクセストークンを取得
      getGapiAccessToken().then(accessToken => {
        if (accessToken) {
          localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
          console.log('Access token stored successfully');
        }
        
        // 認証状態変更イベントを発行
        const event = new CustomEvent('googleAuthStateChanged', { 
          detail: { isAuthenticated: true } 
        });
        window.dispatchEvent(event);
      }).catch(error => {
        console.error('Failed to get access token:', error);
        // IDトークンだけでも認証状態は変更する
        const event = new CustomEvent('googleAuthStateChanged', { 
          detail: { isAuthenticated: true } 
        });
        window.dispatchEvent(event);
      });
      
      return userObject;
    } catch (error) {
      console.error('Error handling credential response:', error);
      return null;
    }
  }
  return null;
};

// GAPIを使用してアクセストークンを取得
const getGapiAccessToken = async () => {
  return new Promise((resolve, reject) => {
    try {
      if (!window.gapi || !window.gapi.auth2) {
        // GAPIクライアントが初期化されていない場合は再初期化
        initGapiClient().then(() => {
          getGapiAccessToken().then(resolve).catch(reject);
        }).catch(reject);
        return;
      }
      
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (!authInstance) {
        reject(new Error('Auth instance not available'));
        return;
      }
      
      // ユーザーが既にサインインしているか確認
      if (authInstance.isSignedIn.get()) {
        const user = authInstance.currentUser.get();
        const authResponse = user.getAuthResponse(true);
        console.log('User already signed in, getting access token');
        resolve(authResponse.access_token);
        return;
      }
      
      // 明示的なサインインを要求
      console.log('Requesting explicit sign in with scopes');
      authInstance.signIn({
        scope: SCOPES
      }).then(user => {
        const authResponse = user.getAuthResponse(true);
        console.log('Sign in successful, got access token');
        resolve(authResponse.access_token);
      }).catch(error => {
        console.error('Sign in failed:', error);
        reject(error);
      });
    } catch (error) {
      console.error('Error in getGapiAccessToken:', error);
      reject(error);
    }
  });
};

// サインイン処理
export const signIn = () => {
  if (!CLIENT_ID) {
    return false;
  }

  if (window.google?.accounts?.id) {
    try {
      // GISのログインプロンプトを表示
      window.google.accounts.id.prompt();
      return true;
    } catch (error) {
      console.error('Error prompting sign in:', error);
      return false;
    }
  } else {
    // Google APIが読み込まれていない場合は初期化
    initGoogleAuth().then(() => {
      signIn();
    }).catch(error => {
      console.error('Failed to initialize Google Auth:', error);
    });
    return false;
  }
};

// 明示的なスコープ承認を要求
export const requestTasksScope = async () => {
  try {
    console.log('Requesting tasks scope explicitly');
    const accessToken = await getGapiAccessToken();
    if (accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to request tasks scope:', error);
    return false;
  }
};

// サインアウト処理
export const signOut = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  
  // GAPIのサインアウト
  if (window.gapi && window.gapi.auth2) {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (authInstance) {
        authInstance.signOut();
      }
    } catch (error) {
      console.error('Error signing out from GAPI:', error);
    }
  }
  
  const event = new CustomEvent('googleAuthStateChanged', { detail: { isAuthenticated: false } });
  window.dispatchEvent(event);
  return true;
};

// 認証状態の確認
export const isAuthenticated = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    if (decoded.exp < currentTime) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return false;
    }
    return true;
  } catch (error) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return false;
  }
};

// ユーザー情報の取得
export const getUserInfo = () => {
  const userInfo = localStorage.getItem(USER_KEY);
  if (!userInfo) return null;
  
  try {
    return JSON.parse(userInfo);
  } catch (error) {
    return null;
  }
};

// アクセストークンの取得
export const getAccessToken = () => {
  // まずGAPIのアクセストークンを試す
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (accessToken) {
    return accessToken;
  }
  
  // アクセストークンがない場合はIDトークンを返す（互換性のため）
  return localStorage.getItem(TOKEN_KEY);
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
