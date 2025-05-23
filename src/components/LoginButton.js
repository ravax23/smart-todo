import React, { useEffect, useRef, useState } from 'react';
import { Typography, Box, CircularProgress, Alert, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import GoogleIcon from '@mui/icons-material/Google';

function LoginButton() {
  const { loading, signIn } = useAuth();
  const googleButtonRef = useRef(null);
  const [error, setError] = useState(null);
  const [renderMethod, setRenderMethod] = useState('auto');

  useEffect(() => {
    // クライアントIDが設定されているか確認
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    console.log('LoginButton - クライアントID:', clientId);
    
    if (!clientId || clientId === 'YOUR_CLIENT_ID_HERE') {
      setError('Google Client IDが設定されていません。管理者に連絡してください。');
      return;
    }

    // Google Sign-Inボタンをレンダリング
    if (window.google && window.google.accounts && window.google.accounts.id && renderMethod === 'auto') {
      try {
        console.log('Google Sign-Inボタンをレンダリングします');
        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          { 
            type: 'standard',
            theme: 'outline',
            size: 'large',
            width: 280,
            text: 'signin_with',
            locale: 'ja'  // 日本語表示に設定
          }
        );
        setError(null);
      } catch (err) {
        console.error('Google Sign-Inボタンのレンダリングに失敗しました:', err);
        setError('ログインボタンの表示に失敗しました。手動ログインをお試しください。');
        setRenderMethod('manual');
      }
    } else if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      console.warn('Google APIが読み込まれていません。手動ログインボタンを表示します。');
      setRenderMethod('manual');
    }
  }, [renderMethod]);

  const handleManualSignIn = () => {
    console.log('手動ログインボタンがクリックされました');
    signIn();
  };

  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h5" gutterBottom>
        Todoアプリへようこそ
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        Google Todoカレンダーと連携するカスタムUIのTodoアプリケーションです。
        始めるにはGoogleアカウントでログインしてください。
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <CircularProgress sx={{ mt: 2 }} />
      ) : (
        <>
          <div ref={googleButtonRef} style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}></div>
          
          {renderMethod === 'manual' && (
            <>
              <Typography variant="body2" sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>
                または
              </Typography>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<GoogleIcon />}
                onClick={handleManualSignIn}
                sx={{ mt: 1 }}
              >
                Googleでログイン
              </Button>
            </>
          )}
          
          <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              デバッグ情報: クライアントID = {process.env.REACT_APP_GOOGLE_CLIENT_ID ? 
                `${process.env.REACT_APP_GOOGLE_CLIENT_ID.substring(0, 10)}...` : 
                'undefined'}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}

export default LoginButton;
