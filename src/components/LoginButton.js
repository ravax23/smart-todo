import React, { useEffect, useRef, useState } from 'react';
import { Box, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function LoginButton() {
  const [error, setError] = useState(null);
  const { signIn } = useAuth();
  const googleButtonRef = useRef(null);

  useEffect(() => {
    // Google Identity Servicesのスクリプトが読み込まれているか確認
    if (window.google && window.google.accounts && window.google.accounts.id) {
      // すでに読み込まれている場合は直接ボタンをレンダリング
      renderGoogleButton();
    } else {
      // スクリプトがまだ読み込まれていない場合はイベントリスナーを設定
      const handleGoogleScriptLoad = () => {
        if (window.google && window.google.accounts && window.google.accounts.id) {
          renderGoogleButton();
        }
      };
      
      window.addEventListener('google-loaded', handleGoogleScriptLoad);
      
      return () => {
        window.removeEventListener('google-loaded', handleGoogleScriptLoad);
      };
    }
  }, []);

  const renderGoogleButton = () => {
    if (googleButtonRef.current && window.google && window.google.accounts && window.google.accounts.id) {
      // 既存のボタンをクリア
      googleButtonRef.current.innerHTML = '';
      
      // Google標準ボタンをレンダリング
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'center',
        width: 240
      });
    }
  };

  // Googleログインボタンのクリックハンドラー（カスタムボタン用）
  const handleGoogleLogin = (e) => {
    // イベントの伝播を停止して、Google標準ボタンのデフォルト動作のみを実行
    e.stopPropagation();
    
    // Google標準ボタンのクリックイベントは自動的にポップアップを開くため、
    // ここでは何もしない（signInを呼び出さない）
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      width: '100%' 
    }}>
      {error ? (
        <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>
      ) : null}
      
      {/* Google標準ボタン用のコンテナ */}
      <Box 
        ref={googleButtonRef}
        onClick={handleGoogleLogin}
        sx={{ 
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          '& > div': {
            margin: '0 auto'
          }
        }}
      />
    </Box>
  );
}

export default LoginButton;
