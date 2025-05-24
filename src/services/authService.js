import { gapi } from 'gapi-script';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events profile email';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];

// ローカルストレージのキー
const ACCESS_TOKEN_KEY = 'google_access_token';
const ID_TOKEN_KEY = 'google_id_token';
const TOKEN_EXPIRY_KEY = 'google_token_expiry';
const USER_INFO_KEY = 'google_user_info';

// Google APIクライアントの初期化
export const initGoogleAuth = () => {
  return new Promise((resolve, reject) => {
    console.log('Initializing Google API client...');
    gapi.load('client:auth2', () => {
      gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        scope: SCOPES,
        discoveryDocs: DISCOVERY_DOCS
      }).then(() => {
        console.log('Google API client initialized successfully');
        const authInstance = gapi.auth2.getAuthInstance();
        
        // 認証状態の変更を監視
        authInstance.isSignedIn.listen(updateSigninStatus);
        
        // 現在の認証状態を設定
        updateSigninStatus(authInstance.isSignedIn.get());
        
        resolve(authInstance);
      }).catch(error => {
        console.error('Error initializing Google API client:', error);
        reject(error);
      });
    });
  });
};

// 認証状態の変更を処理
const updateSigninStatus = (isSignedIn) => {
  console.log('Auth status changed:', isSignedIn ? 'signed in' : 'signed out');
  
  if (isSignedIn) {
    const user = gapi.auth2.getAuthInstance().currentUser.get();
    const profile = user.getBasicProfile();
    const authResponse = user.getAuthResponse(true);
    
    // ユーザー情報を保存
    const userInfo = {
      id: profile.getId(),
      name: profile.getName(),
      email: profile.getEmail(),
      imageUrl: profile.getImageUrl()
    };
    
    // トークン情報を保存
    localStorage.setItem(ACCESS_TOKEN_KEY, authResponse.access_token);
    localStorage.setItem(ID_TOKEN_KEY, authResponse.id_token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, authResponse.expires_at);
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
    
    // 認証状態変更イベントを発行
    const event = new CustomEvent('googleAuthStateChanged', { 
      detail: { isAuthenticated: true } 
    });
    window.dispatchEvent(event);
  } else {
    // 認証情報をクリア
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(ID_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    
    // 認証状態変更イベントを発行
    const event = new CustomEvent('googleAuthStateChanged', { 
      detail: { isAuthenticated: false } 
    });
    window.dispatchEvent(event);
  }
};

// サインイン処理
export const signIn = async () => {
  try {
    console.log('Attempting to sign in...');
    const auth = await initGoogleAuth();
    const result = await auth.signIn();
    console.log('Sign in successful:', result);
    return true;
  } catch (error) {
    console.error('Sign in error:', error);
    return false;
  }
};

// サインアウト処理
export const signOut = async () => {
  try {
    console.log('Attempting to sign out...');
    const auth = await initGoogleAuth();
    await auth.signOut();
    console.log('Sign out successful');
    return true;
  } catch (error) {
    console.error('Sign out error:', error);
    return false;
  }
};

// 認証状態の確認
export const isAuthenticated = () => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!token || !expiry) return false;
  
  // トークンの有効期限をチェック
  if (Date.now() >= parseInt(expiry)) {
    console.log('Token expired, refreshing...');
    refreshToken();
    return false;
  }
  
  return true;
};

// トークンの更新
export const refreshToken = async () => {
  try {
    console.log('Refreshing token...');
    const auth = await initGoogleAuth();
    if (auth.isSignedIn.get()) {
      const user = auth.currentUser.get();
      const authResponse = await user.reloadAuthResponse();
      
      console.log('Token refreshed successfully');
      
      // 新しいトークンを保存
      localStorage.setItem(ACCESS_TOKEN_KEY, authResponse.access_token);
      localStorage.setItem(ID_TOKEN_KEY, authResponse.id_token);
      localStorage.setItem(TOKEN_EXPIRY_KEY, authResponse.expires_at);
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Token refresh error:', error);
    return false;
  }
};

// アクセストークンの取得
export const getAccessToken = () => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!token) return null;
  
  // トークンの有効期限をチェック
  if (expiry && Date.now() >= parseInt(expiry)) {
    console.log('Token expired when getting access token');
    refreshToken();
    return null;
  }
  
  return token;
};

// ユーザー情報の取得
export const getUserInfo = () => {
  const userInfo = localStorage.getItem(USER_INFO_KEY);
  if (!userInfo) return null;
  
  try {
    return JSON.parse(userInfo);
  } catch (error) {
    console.error('Error parsing user info:', error);
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
