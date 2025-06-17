import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import './LoginButton.css';

function LoginButton() {
  const googleButtonRef = useRef(null);
  const [error, setError] = useState(null);
  const [buttonRendered, setButtonRendered] = useState(false);

  const renderGoogleButton = useCallback(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      setError('Google Client IDが設定されていません。管理者に連絡してください。');
      return;
    }

    if (window.google?.accounts?.id && googleButtonRef.current && !buttonRendered) {
      try {
        // ボタンコンテナをクリア
        googleButtonRef.current.innerHTML = '';
        
        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          { 
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            locale: 'ja',
            width: 240 // 固定幅を指定
          }
        );
        
        setButtonRendered(true);
        
        // ボタンレンダリング後にサイズを強制的に固定
        setTimeout(() => {
          if (googleButtonRef.current) {
            const buttonElements = googleButtonRef.current.querySelectorAll('div, iframe');
            buttonElements.forEach(element => {
              element.style.width = '240px';
              element.style.height = '40px';
              element.style.minWidth = '240px';
              element.style.minHeight = '40px';
              element.style.maxWidth = '240px';
              element.style.maxHeight = '40px';
            });
          }
        }, 100);
        
      } catch (err) {
        console.error('Failed to render login button:', err);
        setError('ログインボタンの表示に失敗しました。');
      }
    }
  }, [buttonRendered]);

  useEffect(() => {
    // Google Identity Services の読み込み完了を待つ
    const checkGoogleReady = () => {
      if (window.google?.accounts?.id) {
        renderGoogleButton();
      } else {
        setTimeout(checkGoogleReady, 100);
      }
    };
    
    checkGoogleReady();
  }, [renderGoogleButton]);

  // エラー発生時もボタンサイズを維持
  useEffect(() => {
    if (error && googleButtonRef.current) {
      const container = googleButtonRef.current;
      container.style.width = '240px';
      container.style.height = '40px';
      container.style.minWidth = '240px';
      container.style.minHeight = '40px';
      container.style.maxWidth = '240px';
      container.style.maxHeight = '40px';
    }
  }, [error]);

  return (
    <Box>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      ) : null}
      <Box
        ref={googleButtonRef}
        className={`google-login-button-container ${error ? 'error-state' : ''}`}
        sx={{
          width: '240px !important',
          height: '40px !important',
          minWidth: '240px !important',
          minHeight: '40px !important',
          maxWidth: '240px !important',
          maxHeight: '40px !important',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // 追加の強制スタイル
          '& > div': {
            width: '240px !important',
            height: '40px !important',
            minWidth: '240px !important',
            minHeight: '40px !important',
            maxWidth: '240px !important',
            maxHeight: '40px !important'
          },
          '& iframe': {
            width: '240px !important',
            height: '40px !important'
          },
          '& [role="button"]': {
            width: '240px !important',
            height: '40px !important',
            display: 'flex !important',
            alignItems: 'center !important',
            justifyContent: 'center !important'
          }
        }}
      />
    </Box>
  );
}

export default LoginButton;
