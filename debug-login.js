// ログインボタンのクリックイベントをモニタリングするデバッグコード
console.log('デバッグスクリプトを読み込みました');

// ログインボタンのクリックをモニタリング
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM読み込み完了、ログインボタンを監視します');
  
  // 定期的にボタンを探す（動的に追加される可能性があるため）
  const interval = setInterval(() => {
    const loginButtons = document.querySelectorAll('button');
    loginButtons.forEach(button => {
      if (button.textContent.includes('Google') || button.textContent.includes('ログイン')) {
        if (!button.hasAttribute('data-monitored')) {
          console.log('ログインボタンを発見:', button);
          
          // クリックイベントをモニタリング
          button.addEventListener('click', (e) => {
            console.log('ログインボタンがクリックされました', e);
            console.log('イベントの伝播状態:', e.bubbles, e.cancelable);
            console.log('現在のURL:', window.location.href);
            console.log('ユーザーエージェント:', navigator.userAgent);
            
            // クリック後の状態を追跡
            setTimeout(() => {
              console.log('クリック後のURL (500ms):', window.location.href);
            }, 500);
            
            setTimeout(() => {
              console.log('クリック後のURL (1000ms):', window.location.href);
            }, 1000);
          });
          
          // モニタリング済みとしてマーク
          button.setAttribute('data-monitored', 'true');
        }
      }
    });
  }, 1000);
  
  // 5分後にインターバルをクリア
  setTimeout(() => {
    clearInterval(interval);
    console.log('ボタン監視を終了しました');
  }, 300000);
});

// OAuth認証リダイレクトを監視
window.addEventListener('load', () => {
  console.log('ページ読み込み完了');
  console.log('現在のURL:', window.location.href);
  console.log('URLハッシュ:', window.location.hash);
  
  if (window.location.hash && window.location.hash.includes('access_token=')) {
    console.log('URLにアクセストークンが含まれています');
  }
});

// Google認証関連のイベントを監視
window.addEventListener('googleAuthStateChanged', (event) => {
  console.log('認証状態変更イベントを検出:', event.detail);
});

window.addEventListener('google-loaded', () => {
  console.log('Googleスクリプト読み込み完了イベントを検出');
});

// ページのリロードを監視
let reloadCount = parseInt(sessionStorage.getItem('debug_reload_count') || '0');
sessionStorage.setItem('debug_reload_count', (reloadCount + 1).toString());
console.log(`ページ読み込み回数: ${reloadCount + 1}`);

// ローカルストレージとセッションストレージの状態を監視
console.log('ローカルストレージの状態:', {
  accessToken: !!localStorage.getItem('google_access_token'),
  authToken: !!localStorage.getItem('google_auth_token'),
  userInfo: !!localStorage.getItem('google_user_info')
});

console.log('セッションストレージの状態:', {
  accessToken: !!sessionStorage.getItem('google_access_token'),
  authToken: !!sessionStorage.getItem('google_auth_token')
});
