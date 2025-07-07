import React from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const DebugPanel = () => {
  const { isAuthenticated } = useAuth();
  
  // 開発環境かつ認証済みの場合のみ表示
  if (process.env.NODE_ENV !== 'development' || !isAuthenticated) {
    return null;
  }

  const simulateTokenExpiry = () => {
    console.log('Simulating token expiry for authenticated user...');
    
    // 認証済みユーザーのみシミュレーション実行
    if (isAuthenticated) {
      // アクセストークンを無効な値に変更
      localStorage.setItem('google_access_token', 'invalid_token');
      sessionStorage.setItem('google_access_token', 'invalid_token');
      
      // トークン切れイベントを手動で発火
      const tokenExpiredEvent = new CustomEvent('accessTokenExpired', {
        detail: { 
          path: '/test', 
          method: 'GET', 
          timestamp: new Date().toISOString(),
          simulated: true,
          userInitiated: true
        }
      });
      window.dispatchEvent(tokenExpiredEvent);
      
      console.log('Token expiry simulation completed for authenticated user');
    } else {
      console.log('Cannot simulate token expiry - user not authenticated');
    }
  };

  const clearAllTokens = () => {
    console.log('Clearing all tokens...');
    
    // すべてのトークンをクリア
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_auth_token');
    localStorage.removeItem('google_user_info');
    sessionStorage.removeItem('google_access_token');
    sessionStorage.removeItem('google_auth_token');
    
    // Cookieもクリア
    document.cookie = 'google_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'google_auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    console.log('All tokens cleared');
  };

  const testApiCall = async () => {
    console.log('Testing API call...');
    
    try {
      const response = await fetch('/api/test', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('google_access_token')}`
        }
      });
      
      if (response.status === 401) {
        console.log('401 error received as expected');
      } else {
        console.log('API call response:', response.status);
      }
    } catch (error) {
      console.log('API call error:', error);
    }
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 20, 
        right: 20, 
        p: 2, 
        zIndex: 9999,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        border: '2px solid #ff9800'
      }}
    >
      <Typography variant="h6" gutterBottom color="warning.main">
        🔧 Debug Panel (Dev Only)
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button 
          variant="outlined" 
          color="warning" 
          size="small"
          onClick={simulateTokenExpiry}
        >
          Simulate Token Expiry
        </Button>
        <Button 
          variant="outlined" 
          color="error" 
          size="small"
          onClick={clearAllTokens}
        >
          Clear All Tokens
        </Button>
        <Button 
          variant="outlined" 
          color="info" 
          size="small"
          onClick={testApiCall}
        >
          Test API Call
        </Button>
      </Box>
    </Paper>
  );
};

export default DebugPanel;
