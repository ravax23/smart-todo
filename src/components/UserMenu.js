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

  // ユーザー名の頭文字を取得（デフォルトは'G'）
  const getInitial = () => {
    if (user && user.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'G';
  };

  // ユーザー情報がない場合でもアイコンを表示する
  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{ 
          ml: 1,
          border: '1px solid #e0e0e0',
          bgcolor: 'background.paper',
          '&:hover': { bgcolor: 'background.default' }
        }}
        aria-controls={open ? 'user-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        {user && user.picture ? (
          <Avatar 
            src={user.picture} 
            alt={user.name || 'User'}
            sx={{ width: 32, height: 32 }}
          />
        ) : (
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#4285F4' }}>
            {getInitial()}
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
          elevation: 2,
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
        {user ? (
          <>
            <Box sx={{ px: 2, py: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {user.picture ? (
                  <Avatar 
                    src={user.picture} 
                    alt={user.name}
                    sx={{ width: 40, height: 40, mr: 1 }}
                  />
                ) : (
                  <Avatar sx={{ width: 40, height: 40, mr: 1, bgcolor: '#4285F4' }}>
                    {getInitial()}
                  </Avatar>
                )}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {user.name || 'ユーザー'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                    {user.email || ''}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ mt: 1 }}>
              ログアウト
            </MenuItem>
          </>
        ) : (
          <MenuItem onClick={handleLogout}>
            ログイン
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default UserMenu;
