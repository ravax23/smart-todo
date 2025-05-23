import React, { useEffect, useRef } from 'react';
import { Typography, Box, Button, CircularProgress } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../contexts/AuthContext';

function LoginButton() {
  const { signIn, loading } = useAuth();
  const googleButtonRef = useRef(null);

  useEffect(() => {
    // Google Sign-Inボタンをレンダリング
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        { 
          theme: 'outline', 
          size: 'large',
          width: 280,
          text: 'signin_with'
        }
      );
    }
  }, []);

  const handleManualSignIn = () => {
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
      
      {loading ? (
        <CircularProgress sx={{ mt: 2 }} />
      ) : (
        <>
          <div ref={googleButtonRef} style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}></div>
          
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
    </Box>
  );
}

export default LoginButton;
