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
      
      try {
        localStorage.setItem(TOKEN_KEY, response.credential);
        localStorage.setItem(USER_KEY, JSON.stringify(userObject));
        
        // セッションストレージにもバックアップ（iOSのプライベートブラウジングモード対策）
        sessionStorage.setItem(TOKEN_KEY, response.credential);
        sessionStorage.setItem(USER_KEY, JSON.stringify(userObject));
      } catch (storageError) {
        console.error('Error saving credentials to storage:', storageError);
      }
      
      // GAPIクライアントを使用してアクセストークンを取得
      getGapiAccessToken().then(accessToken => {
        if (accessToken) {
          try {
            localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
            sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
            console.log('Access token stored successfully');
          } catch (storageError) {
            console.error('Error saving access token to storage:', storageError);
          }
        }
        
        // 認証状態変更イベントを発行
        try {
          const event = new CustomEvent('googleAuthStateChanged', { 
            detail: { isAuthenticated: true } 
          });
          window.dispatchEvent(event);
        } catch (eventError) {
          console.error('Error dispatching auth event:', eventError);
        }
      }).catch(error => {
        console.error('Failed to get access token:', error);
        // IDトークンだけでも認証状態は変更する
        try {
          const event = new CustomEvent('googleAuthStateChanged', { 
            detail: { isAuthenticated: true } 
          });
          window.dispatchEvent(event);
        } catch (eventError) {
          console.error('Error dispatching auth event:', eventError);
        }
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
    console.error('Google Client ID is not configured');
    return false;
  }

  try {
    // Google Identity Servicesが利用可能かチェック
    if (window.google?.accounts?.id) {
      console.log('Using Google Identity Services for sign in');
      window.google.accounts.id.prompt();
      return true;
    }
    
    // フォールバック: リダイレクトベースの認証を使用
    console.log('Falling back to redirect-based authentication');
    
    // モバイル環境を検出
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    console.log('Device detection:', isMobile ? 'Mobile' : 'Desktop');
    
    // 明示的にリダイレクトベースの認証を使用
    // モバイルの場合は完全なURLを使用
    const redirectUri = window.location.origin + (isMobile ? window.location.pathname : '');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(SCOPES)}&prompt=consent`;
    
    console.log('Redirecting to auth URL:', authUrl);
    window.location.href = authUrl;
    return true;
  } catch (error) {
    console.error('Error during sign in:', error);
    return false;
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

// サインアウト処理
export const signOut = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    // セッションストレージからも削除
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch (storageError) {
    console.error('Error clearing storage:', storageError);
  }
  
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
  
  try {
    const event = new CustomEvent('googleAuthStateChanged', { detail: { isAuthenticated: false } });
    window.dispatchEvent(event);
  } catch (eventError) {
    console.error('Error dispatching event:', eventError);
  }
  
  return true;
};

// 認証状態の確認
export const isAuthenticated = () => {
  try {
    // ローカルストレージからトークンを取得
    let token = localStorage.getItem(TOKEN_KEY);
    
    // ローカルストレージにない場合はセッションストレージを確認
    if (!token) {
      token = sessionStorage.getItem(TOKEN_KEY);
    }
    
    // アクセストークンの確認
    const accessToken = getAccessToken();
    
    // アクセストークンがあれば認証済みとみなす（iOSのプライベートブラウジングモード対策）
    if (accessToken) {
      return true;
    }
    
    if (!token) return false;
    
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        // トークンの有効期限切れ
        try {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          sessionStorage.removeItem(TOKEN_KEY);
          sessionStorage.removeItem(ACCESS_TOKEN_KEY);
          sessionStorage.removeItem(USER_KEY);
        } catch (storageError) {
          console.error('Error clearing expired tokens:', storageError);
        }
        return false;
      }
      return true;
    } catch (jwtError) {
      console.error('Error decoding JWT:', jwtError);
      try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
      } catch (storageError) {
        console.error('Error clearing invalid tokens:', storageError);
      }
      return false;
    }
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};

// ユーザー情報の取得
export const getUserInfo = () => {
  try {
    // ローカルストレージからユーザー情報を取得
    let userInfo = localStorage.getItem(USER_KEY);
    
    // ローカルストレージにない場合はセッションストレージを確認
    if (!userInfo) {
      userInfo = sessionStorage.getItem(USER_KEY);
    }
    
    if (!userInfo) return null;
    
    try {
      return JSON.parse(userInfo);
    } catch (parseError) {
      console.error('Error parsing user info:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
};

// アクセストークンの取得
export const getAccessToken = () => {
  try {
    // iOS Safariを検出
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOSSafari = isIOS && isSafari;
    
    console.log('Browser detection:', { 
      isIOS, 
      isSafari, 
      isIOSSafari, 
      userAgent: navigator.userAgent 
    });
    
    // URLからアクセストークンを取得（OAuth 2.0リダイレクト後）
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      const accessToken = hash.match(/access_token=([^&]*)/)[1];
      if (accessToken) {
        console.log('Got access token from URL hash');
        
        // モバイル環境を検出
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        console.log('Device detection in getAccessToken:', isMobile ? 'Mobile' : 'Desktop');
        
        // ローカルストレージにトークンを保存
        try {
          localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
          console.log('Access token saved to localStorage');
          
          // セッションストレージにもバックアップ（iOSのプライベートブラウジングモード対策）
          sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
          console.log('Access token saved to sessionStorage');
          
          // iOS Safariの場合はCookieにも保存（バックアップ）
          if (isIOSSafari) {
            document.cookie = `${ACCESS_TOKEN_KEY}=${accessToken};path=/;max-age=3600`;
            console.log('Access token saved to cookie for iOS Safari');
          }
        } catch (storageError) {
          console.error('Error saving to storage:', storageError);
        }
        
        // URLからハッシュを削除
        try {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        } catch (historyError) {
          console.error('Error updating history:', historyError);
        }
        
        // 認証状態変更イベントを発行
        try {
          const event = new CustomEvent('googleAuthStateChanged', { 
            detail: { isAuthenticated: true } 
          });
          window.dispatchEvent(event);
          console.log('Auth state change event dispatched');
        } catch (eventError) {
          console.error('Error dispatching event:', eventError);
        }
        
        return accessToken;
      }
    }
    
    // ローカルストレージからアクセストークンを取得
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (accessToken) {
      return accessToken;
    }
    
    // セッションストレージからアクセストークンを取得（バックアップ）
    const sessionToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    if (sessionToken) {
      return sessionToken;
    }
    
    // iOS Safariの場合はCookieからも取得（バックアップ）
    if (isIOSSafari) {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(`${ACCESS_TOKEN_KEY}=`)) {
          const cookieToken = cookie.substring(`${ACCESS_TOKEN_KEY}=`.length, cookie.length);
          console.log('Access token retrieved from cookie for iOS Safari');
          return cookieToken;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
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
