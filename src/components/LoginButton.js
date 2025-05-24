import React, { useEffect, useRef, useState } from 'react';
import { Typography, Box, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function LoginButton() {
  const { loading } = useAuth();
  const googleButtonRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      setError('Google Client IDが設定されていません。管理者に連絡してください。');
      return;
    }

    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          { 
            type: 'standard',
            theme: 'outline',
            size: 'large',
            width: 280,
            text: 'signin_with',
            locale: 'ja'
          }
        );
        setError(null);
      } catch (err) {
        console.error('Failed to render login button:', err);
        setError('ログインボタンの表示に失敗しました。ページを再読み込みしてください。');
      }
    }
  }, []);

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', color: 'text.primary' }}>
        Todoアプリへようこそ
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
        Google Todoと連携するカスタムUIのTodoアプリケーションです。
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
