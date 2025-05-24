import { jwtDecode } from 'jwt-decode';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'profile',
  'email'
];
const TOKEN_KEY = 'google_access_token';
const USER_KEY = 'google_user_info';

export const initGoogleAuth = () => {
  return new Promise((resolve, reject) => {
    if (!CLIENT_ID) {
      reject(new Error('Google Client ID is not configured'));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      try {
        // OAuth2トークンクライアントの初期化
        window.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES.join(' '),
          callback: handleCredentialResponse,
        });
        
        // ID認証の初期化（プロフィール情報用）
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleIdResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        
        resolve();
      } catch (error) {
        console.error('Google Auth initialization error:', error);
        reject(error);
      }
    };
    script.onerror = () => {
      reject(new Error('Google API script failed to load'));
    };
    document.body.appendChild(script);
  });
};

// アクセストークンのレスポンス処理
const handleCredentialResponse = (response) => {
  console.log('OAuth token response:', response);
  if (response.access_token) {
    localStorage.setItem(TOKEN_KEY, response.access_token);
    
    // 認証状態変更イベントの発行
    const event = new CustomEvent('googleAuthStateChanged', { 
      detail: { isAuthenticated: true } 
    });
    window.dispatchEvent(event);
    return true;
  }
  return false;
};

// IDトークンのレスポンス処理（ユーザー情報用）
const handleIdResponse = (response) => {
  console.log('ID token response received');
  if (response.credential) {
    try {
      const userObject = jwtDecode(response.credential);
      localStorage.setItem(USER_KEY, JSON.stringify(userObject));
    } catch (error) {
      console.error('Error decoding ID token:', error);
    }
  }
};

export const signIn = () => {
  if (!CLIENT_ID) {
    console.error('Google Client ID is not configured');
    return false;
  }

  if (window.tokenClient) {
    try {
      console.log('Requesting access token...');
      window.tokenClient.requestAccessToken();
      return true;
    } catch (error) {
      console.error('Error requesting access token:', error);
      return false;
    }
  } else {
    console.log('Token client not initialized, initializing auth...');
    initGoogleAuth().then(() => {
      if (window.tokenClient) {
        window.tokenClient.requestAccessToken();
      } else {
        console.error('Failed to initialize token client');
      }
    });
    return false;
  }
};

export const signOut = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  
  if (window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(getAccessToken(), () => {
      console.log('Access token revoked');
    });
  }
  
  const event = new CustomEvent('googleAuthStateChanged', { detail: { isAuthenticated: false } });
  window.dispatchEvent(event);
  return true;
};

export const isAuthenticated = () => {
  return !!getAccessToken();
};

export const getUserInfo = () => {
  const userInfo = localStorage.getItem(USER_KEY);
  if (!userInfo) return null;
  
  try {
    return JSON.parse(userInfo);
  } catch (error) {
    return null;
  }
};

export const getAccessToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const addAuthStateListener = (callback) => {
  window.addEventListener('googleAuthStateChanged', (event) => {
    callback(event.detail.isAuthenticated);
  });
};

export const removeAuthStateListener = (callback) => {
  window.removeEventListener('googleAuthStateChanged', callback);
};
