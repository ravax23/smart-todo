import React, { useEffect, useRef, useState } from 'react';
import { Box, Alert, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import GoogleIcon from '@mui/icons-material/Google';

function LoginButton() {
  const [error, setError] = useState(null);
  const { signIn } = useAuth();
  const googleButtonRef = useRef(null);
  const [useCustomButton, setUseCustomButton] = useState(true); // 常にカスタムボタンを使用するように変更

  useEffect(() => {
    // Google Identity Servicesのスクリプトが読み込まれているか確認
    if (!useCustomButton && window.google && window.google.accounts && window.google.accounts.id) {
      // すでに読み込まれている場合は直接ボタンをレンダリング
      renderGoogleButton();
    } else if (!useCustomButton) {
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
  }, [useCustomButton]);

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
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      // ポップアップウィンドウでOAuth 2.0フローを使用
      console.log('Using OAuth2 flow with popup window');
      signIn({ usePopup: true });
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
        // Googleブランドガイドラインに沿ったカスタムボタン
        <Button
          variant="contained"
          onClick={handleGoogleLogin}
          sx={{
            padding: '0',
            borderRadius: '4px',
            textTransform: 'none',
            boxShadow: '0 2px 4px 0 rgba(0,0,0,.25)',
            height: '40px',
            backgroundColor: '#4285F4',
            color: '#ffffff',
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 500,
            fontSize: '14px',
            letterSpacing: '0.2px',
            border: 'none',
            transition: 'box-shadow .3s',
            '&:hover': {
              boxShadow: '0 0 3px 3px rgba(66,133,244,.3)',
              backgroundColor: '#4285F4'
            }
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            width: '100%',
            height: '100%'
          }}>
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#fff',
              borderRadius: '2px',
              padding: '8px',
              marginRight: '8px',
              height: '100%',
              boxSizing: 'border-box'
            }}>
              <GoogleIcon sx={{ color: '#4285F4', fontSize: '18px' }} />
            </Box>
            <Box sx={{ 
              flex: 1, 
              textAlign: 'center',
              paddingRight: '8px'
            }}>
              Googleでログイン
            </Box>
          </Box>
        </Button>
      ) : (
        // Google標準ボタン（使用しない）
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
