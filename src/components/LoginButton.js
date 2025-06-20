import React, { useState } from 'react';
import { Box, Alert, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function LoginButton() {
  const [error, setError] = useState(null);
  const { signIn } = useAuth();

  // Googleログインボタンのクリックハンドラー
  const handleGoogleLogin = () => {
    try {
      signIn();
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
      
      {/* カスタムGoogleログインボタン */}
      <Button
        variant="outlined"
        onClick={handleGoogleLogin}
        sx={{
          backgroundColor: '#ffffff',
          color: '#757575',
          border: '1px solid #dadce0',
          borderRadius: '4px',
          padding: '10px 24px',
          fontSize: '14px',
          fontWeight: '500',
          fontFamily: 'Roboto, sans-serif',
          textTransform: 'none',
          boxShadow: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '240px',
          height: '40px',
          mx: 'auto', // 左右のマージンを自動に設定して中央揃え
          '&:hover': {
            backgroundColor: '#f8f9fa',
            boxShadow: '0 1px 2px rgba(60,64,67,0.3)',
          }
        }}
      >
        {/* Google アイコン */}
        <Box component="span" sx={{ 
          display: 'inline-block', 
          width: '18px', 
          height: '18px', 
          marginRight: '10px',
          backgroundImage: 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMTcuNiA5LjJsLS4xLTEuOEg5djMuNGg0LjhDMTMuNiAxMiAxMyAxMyAxMiAxMy42djIuMmgzYTguOCA4LjggMCAwIDAgMi42LTYuNnoiIGZpbGw9IiM0Mjg1RjQiIGZpbGwtcnVsZT0ibm9uemVybyIvPjxwYXRoIGQ9Ik05IDE4YzIuNCAwIDQuNS0uOCA2LTIuMmwtMy0yLjJhNS40IDUuNCAwIDAgMS04LTIuOUgxVjEzYTkgOSAwIDAgMCA4IDV6IiBmaWxsPSIjMzRBODUzIiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48cGF0aCBkPSJNNCAxMC43YTUuNCA1LjQgMCAwIDEgMC0zLjRWNUgxYTkgOSAwIDAgMCAwIDhsMy0yLjN6IiBmaWxsPSIjRkJCQzA1IiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48cGF0aCBkPSJNOSAzLjZjMS4zIDAgMi41LjQgMy40IDEuM0wxNSAyLjNBOSA5IDAgMCAwIDEgNWwzIDIuNGE1LjQgNS40IDAgMCAxIDUtMy43eiIgZmlsbD0iI0VBNDMzNSIgZmlsbC1ydWxlPSJub256ZXJvIi8+PHBhdGggZD0iTTAgMGgxOHYxOEgweiIvPjwvZz48L3N2Zz4=)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'contain'
        }} />
        Googleでログイン
      </Button>
    </Box>
  );
}

export default LoginButton;
