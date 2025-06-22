import React, { useEffect, useRef, useState } from 'react';
import { Box, Alert, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import SvgIcon from '@mui/material/SvgIcon';

// 虹色のGoogleロゴSVG
const GoogleColorfulIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </SvgIcon>
);

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
        // 指定された画像のデザインに合わせたボタン（虹色のGロゴ）
        <Button
          variant="outlined"
          onClick={handleGoogleLogin}
          sx={{
            padding: '0',
            borderRadius: '2px',
            textTransform: 'none',
            boxShadow: '0 1px 1px 0 rgba(0,0,0,0.24), 0 0 1px 0 rgba(0,0,0,0.12)',
            height: '40px',
            backgroundColor: '#ffffff',
            color: 'rgba(0,0,0,0.54)',
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 500,
            fontSize: '14px',
            letterSpacing: '0.2px',
            border: '1px solid #dadce0',
            width: '100%',
            maxWidth: '240px',
            '&:hover': {
              backgroundColor: '#f8f8f8',
              boxShadow: '0 1px 2px 0 rgba(0,0,0,0.24), 0 0 2px 0 rgba(0,0,0,0.12)',
              borderColor: '#d2d2d2'
            }
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            width: '100%',
            height: '100%',
            position: 'relative',
            paddingLeft: '8px'
          }}>
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: '24px',
              width: '18px',
              height: '18px'
            }}>
              <GoogleColorfulIcon sx={{ 
                fontSize: '18px',
                position: 'absolute',
                left: '12px'
              }} />
            </Box>
            <Box sx={{ 
              flex: 1,
              textAlign: 'center'
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
