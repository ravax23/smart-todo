import React, { useEffect, useRef, useState } from 'react';
import { Box, Alert, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import GoogleIcon from '@mui/icons-material/Google';

function LoginButton() {
  const [error, setError] = useState(null);
  const { signIn } = useAuth();
  const googleButtonRef = useRef(null);
  const [useCustomButton, setUseCustomButton] = useState(false);

  useEffect(() => {
    // モバイルデバイスかどうかを検出
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // モバイルデバイスの場合はカスタムボタンを使用
    if (isMobile) {
      console.log('Mobile device detected, using custom button');
      setUseCustomButton(true);
      return;
    }
    
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
        text: 'signin',  // 'signin_with'から'signin'に変更してユーザー名を表示しないように
        shape: 'rectangular',
        logo_alignment: 'center',
        width: 240
      });
    }
  };

  // Googleログインボタンのクリックハンドラー
  const handleGoogleLogin = (e) => {
    // イベントの伝播を停止
    e.stopPropagation();
    
    try {
      // 直接OAuth 2.0フローを使用
      console.log('Using direct OAuth2 flow for login');
      signIn();
    } catch (error) {
      console.error('Google login error:', error);
      setError('ログインに失敗しました。もう一度お試しください。');
    }
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
      
      {useCustomButton ? (
        // モバイル用のカスタムボタン
        <Button
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          sx={{
            padding: '10px 20px',
            borderRadius: '4px',
            textTransform: 'none',
            fontSize: '16px',
            fontWeight: 500,
            color: '#757575',
            borderColor: '#dadce0',
            '&:hover': {
              borderColor: '#d2e3fc',
              backgroundColor: 'rgba(66, 133, 244, 0.04)',
            }
          }}
        >
          Googleでログイン
        </Button>
      ) : (
        // デスクトップ用のGoogle標準ボタン
        <Box 
          id="googleButtonContainer"
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
      )}
    </Box>
  );
}

export default LoginButton;
