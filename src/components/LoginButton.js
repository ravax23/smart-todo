import React, { useEffect, useRef } from 'react';
import { Typography, Box, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function LoginButton() {
  const { loading } = useAuth();
  const googleButtonRef = useRef(null);

  useEffect(() => {
    // Google Sign-Inボタンをレンダリング
    if (window.google && window.google.accounts && window.google.accounts.id) {
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
      
      {loading ? (
        <CircularProgress sx={{ mt: 2 }} />
      ) : (
        <div ref={googleButtonRef} style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}></div>
      )}
    </Box>
  );
}

export default LoginButton;
