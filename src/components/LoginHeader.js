import React from 'react';
import { Box, Typography, AppBar, Toolbar } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from './UserMenu';
import LoginButton from './LoginButton';

function LoginHeader() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #e0e0e0' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box 
            component="img"
            src="/logo.png"
            alt="SmartTodo Logo"
            sx={{ 
              height: 32,
              mr: 1
            }}
          />
          <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.main' }}>
            SmartTodo
          </Typography>
        </Box>
        <Box>
          {!loading && (isAuthenticated ? <UserMenu /> : <LoginButton />)}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default LoginHeader;
