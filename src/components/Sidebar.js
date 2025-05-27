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

// テーマカラーを取得する関数
const getThemeColor = (type) => {
  // テーマに応じた色を返す
  const colors = {
    primary: '#333333', // 黒色（少し柔らかい黒）
    secondary: '#555555', // グレー
    accent: '#777777', // アクセントカラー
    background: '#f9fafb', // 背景色
    text: '#333333', // テキスト色
    border: '#e0e0e0' // ボーダー色
  };
  
  return colors[type] || colors.primary;
};

const Sidebar = () => {
  const { 
    taskLists, 
    selectedTaskList, 
    selectedFilter,
    selectTaskList, 
    selectFilter,
    updateTaskListTitle, 
    moveTaskToList,
    reorderTaskLists,
    createTaskList,
    searchTasks
  } = useTodo();
  const [editingListId, setEditingListId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingNewList, setIsAddingNewList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  // フィルターリスト
  const filters = [
    { id: 'today', name: '今日', icon: '📅' },
    { id: 'tomorrow', name: '明日', icon: '📆' },
    { id: 'after-tomorrow', name: '今週', icon: '📆' }, // 日曜日から土曜日までのタスク
    { id: 'past', name: '期限切れ', icon: '⏱️' },
    { id: 'starred', name: 'スター付き', icon: '⭐' },
    { id: 'all', name: 'すべて', icon: '📋' },
  ];

  // カテゴリ別の色を定義（使用しない）
  const categoryColors = {
    'default': '#1976d2'
  };

  // タスクリストのカテゴリを判定する関数（使用しない）
  const getListCategory = () => {
    return 'default';
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

  // ドラッグ終了時の処理（リストの並び替え）
  const handleDragEnd = (e) => {
    // ドラッグ終了時の処理（HTML5 Drag and Drop API）
    const fromIndex = parseInt(e.dataTransfer.getData('listIndex'));
    const toIndex = parseInt(e.currentTarget.dataset.index);
    
    if (isNaN(fromIndex) || isNaN(toIndex) || fromIndex === toIndex) return;
    
    // リストの並び替え
    const newTaskLists = Array.from(taskLists);
    const [movedItem] = newTaskLists.splice(fromIndex, 1);
    newTaskLists.splice(toIndex, 0, movedItem);
    
    // コンテキストの関数を呼び出して並び替えを保存
    reorderTaskLists(newTaskLists);
  };

  // ドラッグ開始時の処理
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('listIndex', index);
    e.currentTarget.style.opacity = '0.6';
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

  // ドラッグ終了時の処理
  const handleDragEndItem = (e) => {
    e.currentTarget.style.opacity = '1';
    e.currentTarget.style.backgroundColor = '';
  };

  // ドロップ時の処理（タスクをリストに移動）
  const handleDrop = (e, listId) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = '';
    
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      moveTaskToList(taskId, listId);
    } else {
      handleDragEnd(e);
    }
  };

  // 検索フィールドの変更を処理
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // 検索クエリをTodoContextの検索関数に渡す
    searchTasks(e.target.value);
  };
  
  // 新規リスト追加ボタンのクリックハンドラ
  const handleAddNewList = () => {
    setIsAddingNewList(true);
    setNewListTitle('');
  };
  
  // 新規リストの作成を保存
  const handleSaveNewList = async () => {
    if (newListTitle.trim()) {
      try {
        await createTaskList(newListTitle.trim());
        setIsAddingNewList(false);
        setNewListTitle('');
      } catch (error) {
        console.error('Failed to create new list:', error);
      }
    } else {
      setIsAddingNewList(false);
    }
  };

  // 新規リスト作成をキャンセル
  const handleCancelNewList = () => {
    setIsAddingNewList(false);
    setNewListTitle('');
  };

  return (
    <Box sx={{ 
      width: 280, 
      bgcolor: 'white', 
      borderRight: '1px solid #e0e0e0',
      display: 'flex',
      flexDirection: 'column',
      p: 2
    }}>
      {/* アプリタイトル */}
      <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.main', mb: 3 }}>
        SmartTodo
      </Typography>
      
      {/* 検索フィールド */}
      <Box sx={{ position: 'relative', mb: 3 }}>
        <TextField
          fullWidth
          placeholder="タスクを検索..."
          variant="outlined"
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{
            '& .MuiOutlinedInput-root': {
              pl: 4,
              bgcolor: '#f9fafb',
            }
          }}
        />
        <Box 
          sx={{ 
            position: 'absolute', 
            left: 12, 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: 'text.secondary', 
            fontSize: '1rem'
          }}
        >
          🔍
        </Box>
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
              '&.Mui-selected': {
                bgcolor: `${getThemeColor('background')}`,
                color: getThemeColor('primary'),
                fontWeight: 500,
              },
              '&:hover': {
                bgcolor: getThemeColor('background'),
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Box component="span" sx={{ fontSize: '1.2rem' }}>{filter.icon}</Box>
            </ListItemIcon>
            <ListItemText 
              primary={filter.name} 
              primaryTypographyProps={{ fontSize: '0.9375rem' }}
            />
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
      
      <List sx={{ p: 0, maxHeight: '400px', overflowY: 'auto' }}>
        {/* タスクリスト一覧 */}
        {taskLists && taskLists.map((list, index) => (
          <ListItem
            key={list.id}
            button
            draggable
            data-index={index}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDragEnd={handleDragEndItem}
            onDrop={(e) => handleDrop(e, list.id)}
            selected={list.id === selectedTaskList}
            onClick={() => selectTaskList(list.id)}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              py: 1,
              '&.Mui-selected': {
                bgcolor: `${getThemeColor('background')}`,
                color: getThemeColor('primary'),
                fontWeight: 500,
              },
              '&:hover': {
                bgcolor: getThemeColor('background'),
                cursor: 'grab'
              },
              '&:active': {
                cursor: 'grabbing'
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Box component="span" sx={{ fontSize: '1.2rem' }}>📁</Box>
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
              <ListItemText 
                primary={list.title} 
                primaryTypographyProps={{ fontSize: '0.9375rem' }}
                onDoubleClick={() => handleStartEditing(list)}
              />
            )}
          </ListItem>
        ))}
        
        {isAddingNewList ? (
          <ListItem sx={{ mt: 1, pl: 1 }}>
            <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
              <TextField
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                autoFocus
                placeholder="新しいリスト名"
                variant="standard"
                fullWidth
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveNewList();
                  } else if (e.key === 'Escape') {
                    handleCancelNewList();
                  }
                }}
                sx={{ 
                  '& .MuiInput-root': { 
                    fontSize: '0.9375rem'
                  }
                }}
              />
              <IconButton 
                size="small" 
                onClick={handleSaveNewList}
                sx={{ ml: 1, color: 'primary.main' }}
              >
                <Box component="span" sx={{ fontSize: '0.875rem' }}>✓</Box>
              </IconButton>
              <IconButton 
                size="small" 
                onClick={handleCancelNewList}
                sx={{ color: 'text.secondary' }}
              >
                <Box component="span" sx={{ fontSize: '0.875rem' }}>✕</Box>
              </IconButton>
            </Box>
          </ListItem>
        ) : (
          <ListItem 
            button 
            onClick={handleAddNewList}
            sx={{ 
              mt: 1, 
              borderRadius: 1,
              color: 'text.secondary',
              '&:hover': { 
                bgcolor: getThemeColor('background'),
                color: 'primary.main'
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Box component="span" sx={{ fontSize: '1.2rem' }}>📝</Box>
            </ListItemIcon>
            <ListItemText 
              primary="マイリストを追加" 
              primaryTypographyProps={{ 
                fontSize: '0.9375rem',
                fontWeight: 400
              }}
            />
          </ListItem>
        )}
      </List>
    </Box>
  );
};

export default Sidebar;
