import React, { useState } from 'react';
import { 
  Box, 
  Avatar, 
  Typography, 
  Menu, 
  MenuItem, 
  IconButton,
  Divider
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const UserMenu = () => {
  const { user, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    signOut();
  };

  // ユーザー情報がない場合は何も表示しない
  if (!user) return null;

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{ ml: 2 }}
        aria-controls={open ? 'user-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        {user.picture ? (
          <Avatar 
            src={user.picture} 
            alt={user.name}
            sx={{ width: 32, height: 32 }}
          />
        ) : (
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </Avatar>
        )}
      </IconButton>
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            width: 220,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {user.picture ? (
              <Avatar 
                src={user.picture} 
                alt={user.name}
                sx={{ width: 40, height: 40, mr: 1 }}
              />
            ) : (
              <Avatar sx={{ width: 40, height: 40, mr: 1, bgcolor: 'primary.main' }}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
            )}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {user.name}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                {user.email}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ mt: 1 }}>
          ログアウト
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserMenu;
