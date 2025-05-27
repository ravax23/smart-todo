import React, { useEffect, useRef, useState } from 'react';
import { Box, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function LoginButton() {
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
            size: 'medium',
            text: 'signin_with',
            locale: 'ja'
          }
        );
      } catch (err) {
        console.error('Failed to render login button:', err);
        setError('ログインボタンの表示に失敗しました。');
      }
    }
  }, []);

  return (
    <Box>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      ) : (
        <div ref={googleButtonRef}></div>
      )}
    </Box>
  );
}

export default LoginButton;
