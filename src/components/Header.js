import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Avatar, Menu, MenuItem } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import { useState } from 'react';

function Header({ title }) {
  const { isAuthenticated, user, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    signOut();
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
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              color="inherit"
              size="small"
              sx={{ mr: 1, color: 'text.secondary' }}
            >
              <SettingsIcon />
            </IconButton>
            
            <IconButton
              onClick={handleMenu}
              size="small"
              sx={{ p: 0.5 }}
            >
              {user && user.picture ? (
                <Avatar 
                  alt={user.name} 
                  src={user.picture} 
                  sx={{ width: 32, height: 32 }}
                />
              ) : (
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user && user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
              )}
            </IconButton>
            
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={open}
              onClose={handleClose}
            >
              {user && (
                <MenuItem disabled sx={{ opacity: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle2">{user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                  </Box>
                </MenuItem>
              )}
              <MenuItem onClick={handleLogout}>
                <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                ログアウト
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Header;
