import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const { isAuthenticated, setIsAuthenticated } = useAuth();

  const handleLogout = () => {
    // ログアウト処理
    setIsAuthenticated(false);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Todo App
        </Typography>
        {isAuthenticated && (
          <Box>
            <Button color="inherit" onClick={handleLogout}>
              ログアウト
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Header;
