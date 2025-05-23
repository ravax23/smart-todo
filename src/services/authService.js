import { jwtDecode } from 'jwt-decode';

// Google OAuth認証のためのクライアントID
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// 必要なスコープ（最小限に設定）
const SCOPES = 'profile email';

// ローカルストレージのキー
const TOKEN_KEY = 'google_auth_token';
const USER_KEY = 'google_user_info';

/**
 * Google認証の初期化
 */
export const initGoogleAuth = () => {
  return new Promise((resolve, reject) => {
    // デバッグ情報: 環境変数
    console.log('環境変数一覧:', process.env);
    console.log('REACT_APP_GOOGLE_CLIENT_ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
    
    // クライアントIDが設定されているか確認
    if (!CLIENT_ID || CLIENT_ID === 'YOUR_CLIENT_ID_HERE') {
      console.error('Google Client IDが設定されていません。.envファイルにREACT_APP_GOOGLE_CLIENT_IDを設定してください。');
      reject(new Error('Google Client ID is not configured'));
      return;
    }

    console.log('使用するクライアントID:', CLIENT_ID);

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      try {
        console.log('Google API scriptの読み込みが完了しました');
        
        // Google APIが正しく読み込まれたか確認
        if (!window.google || !window.google.accounts || !window.google.accounts.id) {
          console.error('Google APIが正しく読み込まれていません:', window.google);
          reject(new Error('Google API is not loaded correctly'));
          return;
        }
        
        // 初期化オプションをデバッグ出力
        const initOptions = {
          client_id: CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        };
        console.log('初期化オプション:', initOptions);
        
        window.google.accounts.id.initialize(initOptions);
        console.log('Google認証の初期化が完了しました');
        resolve();
      } catch (error) {
        console.error('Google認証の初期化に失敗しました:', error);
        console.error('エラースタック:', error.stack);
        reject(error);
      }
    };
    script.onerror = (error) => {
      console.error('Google API scriptの読み込みに失敗しました:', error);
      reject(new Error('Google API script failed to load'));
    };
    document.body.appendChild(script);
  });
};

/**
 * 認証レスポンスのハンドラ
 */
const handleCredentialResponse = (response) => {
  console.log('Google認証レスポンス:', response);
  
  if (response.credential) {
    try {
      // JWTをデコードしてユーザー情報を取得
      const userObject = jwtDecode(response.credential);
      console.log('デコードされたユーザー情報:', userObject);
      
      // トークンとユーザー情報を保存
      localStorage.setItem(TOKEN_KEY, response.credential);
      localStorage.setItem(USER_KEY, JSON.stringify(userObject));
      
      // カスタムイベントを発行して認証状態の変更を通知
      const event = new CustomEvent('googleAuthStateChanged', { detail: { isAuthenticated: true } });
      window.dispatchEvent(event);
      
      return userObject;
    } catch (error) {
      console.error('トークンのデコードに失敗しました:', error);
      console.error('エラースタック:', error.stack);
      return null;
    }
  } else {
    console.error('認証情報が含まれていません:', response);
    return null;
  }
};

/**
 * ログイン処理
 */
export const signIn = () => {
  // クライアントIDが設定されているか確認
  if (!CLIENT_ID || CLIENT_ID === 'YOUR_CLIENT_ID_HERE') {
    alert('Google Client IDが設定されていません。.envファイルを確認してください。');
    return false;
  }

  console.log('ログイン処理を開始します');
  console.log('Google API状態:', window.google);
  
  if (window.google && window.google.accounts && window.google.accounts.id) {
    try {
      window.google.accounts.id.prompt((notification) => {
        console.log('プロンプト通知:', notification);
        
        if (notification.isNotDisplayed()) {
          console.log('ログインプロンプトが表示されませんでした:', notification.getNotDisplayedReason());
          // 特定のエラーに対する処理
          if (notification.getNotDisplayedReason() === 'credential_returned') {
            // 既に認証情報が返されている場合は再度初期化
            initGoogleAuth().then(() => {
              window.google.accounts.id.prompt();
            });
          }
        } else if (notification.isSkippedMoment()) {
          console.log('ログインがスキップされました:', notification.getSkippedReason());
        } else if (notification.isDismissedMoment()) {
          console.log('ログインが閉じられました:', notification.getDismissedReason());
        }
      });
      return true;
    } catch (error) {
      console.error('ログインプロンプトの表示に失敗しました:', error);
      console.error('エラースタック:', error.stack);
      return false;
    }
  } else {
    console.error('Google認証が初期化されていません');
    // 初期化を再試行
    initGoogleAuth().then(() => {
      signIn();
    }).catch(error => {
      console.error('Google認証の初期化に失敗しました:', error);
    });
    return false;
  }
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
      console.log('トークンの期限が切れています');
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('無効なトークン:', error);
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
    console.error('無効なユーザー情報:', error);
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
