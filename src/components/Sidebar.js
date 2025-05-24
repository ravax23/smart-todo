import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  InputBase, 
  Paper,
  TextField,
  IconButton,
  ClickAwayListener,
  Tooltip
} from '@mui/material';
import { useTodo } from '../contexts/TodoContext';

const Sidebar = () => {
  const { 
    taskLists, 
    selectedTaskList, 
    selectedFilter,
    selectTaskList, 
    selectFilter,
    updateTaskListTitle, 
    moveTaskToList 
  } = useTodo();
  const [editingListId, setEditingListId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  // フィルターリスト
  const filters = [
    { id: 'today', name: '今日', icon: '📅' },
    { id: 'tomorrow', name: '明日', icon: '📆' },
    { id: 'after-tomorrow', name: '今週', icon: '📆' },
    { id: 'past', name: '過去', icon: '⏱️' },
    { id: 'all', name: 'すべて', icon: '📋' },
  ];

  // カテゴリ別の色を定義
  const categoryColors = {
    'work-hisys': '#e74c3c',
    'work-internal': '#3498db',
    'personal': '#2ecc71'
  };

  // タスクリストのカテゴリを判定する関数
  const getListCategory = (list) => {
    // ここでは仮のロジックとして、リストのタイトルに基づいてカテゴリを判定
    if (list.title.includes('HISYS')) {
      return 'work-hisys';
    } else if (list.title.includes('社内')) {
      return 'work-internal';
    } else {
      return 'personal';
    }
  };

  // リスト名の編集を開始
  const handleStartEditing = (list) => {
    setEditingListId(list.id);
    setEditingTitle(list.title);
  };

  // リスト名の編集を保存
  const handleSaveEditing = () => {
    if (editingListId && editingTitle.trim()) {
      updateTaskListTitle(editingListId, editingTitle.trim());
      setEditingListId(null);
      setEditingTitle('');
    }
  };

  // リスト名の編集をキャンセル
  const handleCancelEditing = () => {
    setEditingListId(null);
    setEditingTitle('');
  };

  // ドラッグオーバー時の処理
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = '#f0f0f0';
  };

  // ドラッグリーブ時の処理
  const handleDragLeave = (e) => {
    e.currentTarget.style.backgroundColor = '';
  };

  // ドロップ時の処理
  const handleDrop = (e, listId) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = '';
    
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      moveTaskToList(taskId, listId);
    }
  };

  return (
    <Box sx={{ 
      width: 300, 
      bgcolor: 'background.paper', 
      borderRight: '1px solid #e5e7eb',
      p: 3,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* アプリロゴとタイトル */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ 
          width: 40, 
          height: 40, 
          bgcolor: 'primary.main', 
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          mr: 2
        }}>
          T
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Todo App
        </Typography>
      </Box>

      {/* 検索ボックス */}
      <Box sx={{ position: 'relative', mb: 3 }}>
        <Box sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'text.secondary' }}>
          🔍
        </Box>
        <InputBase
          placeholder="検索"
          sx={{
            width: '100%',
            bgcolor: 'background.default',
            border: '1px solid #e5e7eb',
            borderRadius: 1,
            p: '8px 12px 8px 36px',
            fontSize: '0.875rem',
            '&:focus-within': {
              borderColor: 'secondary.main',
              boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.2)',
            }
          }}
        />
      </Box>

      {/* フィルターリスト */}
      <Typography variant="caption" sx={{ 
        textTransform: 'uppercase', 
        letterSpacing: '0.05em', 
        color: 'text.secondary',
        mb: 1,
        pl: 1
      }}>
        フィルター
      </Typography>
      <List sx={{ mb: 2, p: 0 }}>
        {filters.map((filter) => (
          <ListItem
            key={filter.id}
            button
            selected={filter.id === selectedFilter}
            onClick={() => selectFilter(filter.id)}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              py: 1,
              '&.Mui-selected': {
                bgcolor: 'primary.light',
                color: 'primary.main',
                fontWeight: 500,
              },
              '&:hover': {
                bgcolor: 'background.default',
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Box component="span" sx={{ fontSize: '1.2rem' }}>{filter.icon}</Box>
            </ListItemIcon>
            <ListItemText primary={filter.name} primaryTypographyProps={{ fontSize: '0.9375rem' }} />
          </ListItem>
        ))}
      </List>

      {/* タスクリスト */}
      <Typography variant="caption" sx={{ 
        textTransform: 'uppercase', 
        letterSpacing: '0.05em', 
        color: 'text.secondary',
        mb: 1,
        pl: 1
      }}>
        マイリスト
      </Typography>
      <List sx={{ p: 0 }}>
        {taskLists && taskLists.map((list) => {
          const category = getListCategory(list);
          return (
            <ListItem
              key={list.id}
              button
              selected={list.id === selectedTaskList}
              onClick={() => selectTaskList(list.id)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, list.id)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                py: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  fontWeight: 500,
                },
                '&:hover': {
                  bgcolor: 'background.default',
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Box 
                  component="span" 
                  sx={{ 
                    width: 10, 
                    height: 10, 
                    borderRadius: '50%', 
                    bgcolor: categoryColors[category],
                    display: 'inline-block'
                  }} 
                />
              </ListItemIcon>
              {editingListId === list.id ? (
                <ClickAwayListener onClickAway={handleSaveEditing}>
                  <TextField
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    autoFocus
                    variant="standard"
                    fullWidth
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveEditing();
                      } else if (e.key === 'Escape') {
                        handleCancelEditing();
                      }
                    }}
                    sx={{ 
                      '& .MuiInput-root': { 
                        fontSize: '0.9375rem',
                        fontWeight: list.id === selectedTaskList ? 500 : 400
                      }
                    }}
                  />
                </ClickAwayListener>
              ) : (
                <Tooltip title="ダブルクリックで名前を変更">
                  <ListItemText 
                    primary={list.title} 
                    primaryTypographyProps={{ fontSize: '0.9375rem' }}
                    onDoubleClick={() => handleStartEditing(list)}
                  />
                </Tooltip>
              )}
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default Sidebar;
