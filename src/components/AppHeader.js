import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Avatar, 
  Menu, 
  MenuItem,
  AppBar,
  Toolbar,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../contexts/AuthContext';
import { useTodo } from '../contexts/TodoContext';
import SyncStatusIndicator from './SyncStatusIndicator';

const AppHeader = ({ title }) => {
  const { isAuthenticated, user, signOut } = useAuth();
  const { 
    selectedTaskList, 
    selectedFilter,
    taskLists,
    showCompleted,
    toggleShowCompleted,
    deleteTaskList
  } = useTodo();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // 選択されているタスクリストの情報を取得
  const selectedListInfo = taskLists?.find(list => list.id === selectedTaskList) || { title: 'すべてのタスク' };

  // 選択されているフィルターの情報を取得
  const filters = [
    { id: 'today', name: '今日', icon: '📅' },
    { id: 'tomorrow', name: '明日', icon: '📆' },
    { id: 'after-tomorrow', name: '今週', icon: '📆' },
    { id: 'past', name: '期限切れ', icon: '⏱️' },
    { id: 'starred', name: 'スター付き', icon: '⭐' },
    { id: 'all', name: 'すべて', icon: '📋' },
  ];
  const selectedFilterInfo = filters.find(filter => filter.id === selectedFilter);

  // タスクリストのタイトルを取得する関数
  const getListTitle = () => {
    if (selectedFilter !== 'all') {
      return selectedFilterInfo?.name || 'すべてのタスク';
    } else if (!selectedTaskList) {
      return 'すべてのタスク';
    } else {
      return selectedListInfo.title;
    }
  };

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

  // 設定ダイアログを開く
  const handleOpenSettingsDialog = () => {
    // 設定ダイアログを開く処理
    console.log('Open settings dialog');
  };

  // 削除確認ダイアログを開く
  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  // 削除確認ダイアログを閉じる
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  // タスクリストを削除する
  const handleDeleteTaskList = async () => {
    try {
      await deleteTaskList(selectedTaskList);
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Failed to delete task list:', err);
    }
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
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', px: 4 }}>
        {/* 左側：アプリタイトル */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box 
            component="img" 
            src="/logo.png" 
            alt="SmartTodo Logo" 
            sx={{ 
              height: 36,
              width: 'auto',
              mr: 1.5
            }}
          />
          <Typography 
            variant="h4" 
            component="div" 
            sx={{ 
              fontWeight: 500,
              letterSpacing: '-0.5px',
              fontFamily: "'Poppins', 'Roboto', 'Helvetica', 'Arial', sans-serif",
              color: '#333333',
              textShadow: '0px 2px 4px rgba(0,0,0,0.1)',
              transform: 'scale(1.1)',
              transition: 'all 0.3s ease'
            }}
          >
            Smart<Box component="span" sx={{ fontWeight: 700, color: '#000000' }}>Todo</Box>
          </Typography>
        </Box>

        {/* 右側：マイリストタイトル、完了タスク表示、設定、ユーザー情報 */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* マイリストタイトル */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '1.8rem' }}>
              {getListTitle()}
            </Typography>
            
            {/* マイリスト削除ボタン - マイリストが選択されている場合のみ表示 */}
            {selectedTaskList && selectedTaskList !== 'all' && selectedTaskList !== 'today' && selectedTaskList !== 'tomorrow' && selectedTaskList !== 'after-tomorrow' && selectedTaskList !== 'past' && (
              <IconButton
                size="small"
                onClick={handleOpenDeleteDialog}
                sx={{ 
                  color: 'text.secondary',
                  ml: 0.5,
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                }}
                title="マイリストを削除"
              >
                <Box component="span" sx={{ fontSize: '1.2rem', display: 'block' }} className="emoji-icon">🗑️</Box>
              </IconButton>
            )}
          </Box>

          {/* 完了タスク表示切替 */}
          <FormControlLabel 
            control={
              <Checkbox 
                checked={showCompleted} 
                onChange={toggleShowCompleted}
                size="small"
              />
            } 
            label="完了タスクを表示"
            sx={{ mr: 2 }}
          />
          
          {/* 同期状態インジケーター */}
          <SyncStatusIndicator />
          
          {/* 設定ボタン */}
          <IconButton 
            color="inherit"
            size="small"
            onClick={handleOpenSettingsDialog}
            sx={{ mr: 1, color: 'text.secondary' }}
          >
            <SettingsIcon />
          </IconButton>
          
          {/* ユーザーアバター */}
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
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
