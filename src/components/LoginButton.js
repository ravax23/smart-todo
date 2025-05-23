import React from 'react';
import { Button, Typography, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function LoginButton() {
  const { setIsAuthenticated } = useAuth();

  const handleLogin = () => {
    // 実際にはGoogle OAuth認証を行う
    // 現段階ではモック
    setIsAuthenticated(true);
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
      <Button
        variant="contained"
        color="primary"
        size="large"
        onClick={handleLogin}
        sx={{ mt: 2 }}
      >
        Googleでログイン
      </Button>
    </Box>
  );
}

export default LoginButton;
