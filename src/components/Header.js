import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';

function Header({ title }) {
  const { isAuthenticated, setIsAuthenticated } = useAuth();

  const handleLogout = () => {
    // ログアウト処理
    setIsAuthenticated(false);
  };

  return (
    <AppBar 
      position="static" 
      color="transparent" 
      elevation={0}
      sx={{ 
        borderBottom: '1px solid #e0e0e0',
        bgcolor: 'background.paper'
      }}
    >
      <Toolbar>
        <Typography 
          variant="h5" 
          component="div" 
          sx={{ 
            flexGrow: 1, 
            fontWeight: 500,
            color: 'text.primary'
          }}
        >
          {title || 'Todo App'}
        </Typography>
        
        {isAuthenticated && (
          <Box>
            <IconButton 
              color="inherit"
              size="small"
              sx={{ mr: 1, color: 'text.secondary' }}
            >
              <SettingsIcon />
            </IconButton>
            <IconButton
              color="inherit"
              size="small"
              onClick={handleLogout}
              sx={{ color: 'text.secondary' }}
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Header;
