import React, { useEffect, useRef, useState } from 'react';
import { Typography, Box, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function LoginButton() {
  const { loading } = useAuth();
  const googleButtonRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // クライアントIDが設定されているか確認
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'YOUR_CLIENT_ID_HERE') {
      setError('Google Client IDが設定されていません。管理者に連絡してください。');
      return;
    }

    // Google Sign-Inボタンをレンダリング
    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
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
        setError('ログインボタンの表示に失敗しました。ページを再読み込みしてください。');
      }
    }
  }, []);

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
        <div ref={googleButtonRef} style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}></div>
      )}
    </Box>
  );
}

export default LoginButton;
