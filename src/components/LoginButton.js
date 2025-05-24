import React, { useEffect, useState } from 'react';
import { Typography, Box, Button, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function LoginButton() {
  const { loading, signIn } = useAuth();
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    try {
      setError(null);
      const success = await signIn();
      if (!success) {
        setError('ログインに失敗しました。もう一度お試しください。');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('ログイン処理中にエラーが発生しました。');
    }
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
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleLogin}
          sx={{ mt: 2 }}
        >
          Googleでログイン
        </Button>
      )}
    </Box>
  );
}

export default LoginButton;
