import React, { useState } from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  Divider, 
  CircularProgress, 
  Alert,
  Typography,
  IconButton,
  Checkbox,
  Menu,
  MenuItem
} from '@mui/material';
import { format, parseISO, isValid, isToday, isBefore, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useTodo } from '../contexts/TodoContext';
import AppHeader from './AppHeader';
import SearchBar from './SearchBar';

// カテゴリ別の色を定義（単一色に変更）
const categoryColors = {
  'default': '#1976d2'
};

const TodoList = () => {
  const { 
    todos, 
    loading, 
    error,
    deleteTask,
    toggleTaskCompletion,
    updateTask,
    reorderTasks,
    taskLists
  } = useTodo();
  
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // テーマカラーを取得する関数
  const getThemeColor = (type) => {
    // CSSカスタムプロパティを使用
    switch (type) {
      case 'primary':
        return 'var(--primary-color)';
      case 'secondary':
        return 'var(--secondary-color)';
      case 'accent':
        return 'var(--accent-color)';
      case 'background':
        return 'var(--background-color)';
      case 'text':
        return 'var(--text-color)';
      case 'border':
        return 'var(--border-color)';
      default:
        return 'var(--primary-color)';
    }
  };
  
  // タスクの期限に基づいて背景色を取得する関数
  const getTaskBackgroundColor = (task) => {
    if (!task.startDate) return 'var(--task-normal-color)'; // 期限なし
    
    try {
      const date = parseISO(task.startDate);
      const today = new Date();
      
      // 期限切れ: 薄い赤色
      if (isBefore(date, startOfDay(today))) {
        return 'var(--task-overdue-color)';
      }
      // 今日中: 薄いオレンジ色
      else if (isToday(date)) {
        return 'var(--task-today-color)';
      }
      // それ以外: 白色
      else {
        return 'var(--task-normal-color)';
      }
    } catch (e) {
      return 'var(--task-normal-color)';
    }
  };

  // メニューを開く
  const handleMenuOpen = (event, task) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  // メニューを閉じる
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // タスクを編集する
  const handleEditTask = () => {
    if (!selectedTask) return;
    
    // 編集機能は別コンポーネントに移動したため、ここでは単純にメニューを閉じる
    console.log('Edit task:', selectedTask);
    handleMenuClose();
  };

  // タスクを削除する
  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    
    try {
      await deleteTask(selectedTask.id);
      handleMenuClose();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // タスクの完了状態を切り替える
  const handleToggleTaskCompletion = async (taskId, currentStatus) => {
    try {
      await toggleTaskCompletion(taskId, currentStatus);
    } catch (err) {
      console.error('Failed to toggle task completion:', err);
    }
  };

  // タスクの順序変更
  const moveTask = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    const updatedTasks = [...todos];
    const [movedTask] = updatedTasks.splice(fromIndex, 1);
    updatedTasks.splice(toIndex, 0, movedTask);
    
    // コンテキストの関数を呼び出して並び替えを保存
    // メモリ内で並び替えを行い、同期キューに追加
    reorderTasks(updatedTasks);
  };

  // ドラッグ開始時の処理
  const handleDragStart = (e, task, index) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.setData('taskIndex', index);
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

  // ドロップ時の処理
  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = '';
    
    const sourceIndex = parseInt(e.dataTransfer.getData('taskIndex'));
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;
    
    moveTask(sourceIndex, targetIndex);
  };

  // ドラッグ終了時の処理
  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <AppHeader />
      
      {/* 検索バーと新規タスク追加ボタン */}
      <SearchBar />
      
      {/* タスクリスト */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 4, pb: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
        ) : todos.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            my: 8,
            color: 'text.secondary'
          }}>
            <Box component="span" sx={{ fontSize: '3rem', mb: 2 }}>📝</Box>
            <Typography variant="h6">タスクがありません</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              新しいタスクを追加してみましょう
            </Typography>
          </Box>
        ) : (
          <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)' }}>
            {todos.map((task, index) => (
              <React.Fragment key={task.id}>
                <ListItem
                  sx={{ 
                    py: 1.5,
                    px: 2,
                    bgcolor: getTaskBackgroundColor(task),
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)'
                    },
                    borderRadius: 0,
                    mb: 0,
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task, index)}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <Checkbox
                    checked={task.status === 'completed'}
                    onChange={() => handleToggleTaskCompletion(task.id, task.status)}
                    sx={{ 
                      mr: 1,
                      color: getThemeColor('primary'),
                      '&.Mui-checked': {
                        color: getThemeColor('primary'),
                      }
                    }}
                  />
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    flexGrow: 1,
                    textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                    color: task.status === 'completed' ? 'text.disabled' : 'text.primary'
                  }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {task.title}
                    </Typography>
                    {task.notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {task.notes}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      {task.startDate && isValid(parseISO(task.startDate)) && (
                        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                          {format(parseISO(task.startDate), 'yyyy/MM/dd (E)', { locale: ja })}
                        </Typography>
                      )}
                      {task.starred && (
                        <Box component="span" sx={{ color: 'warning.main', fontSize: '0.875rem', mr: 1 }}>⭐</Box>
                      )}
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, task)}
                    sx={{ color: 'text.secondary' }}
                  >
                    <Box component="span" sx={{ fontSize: '1.2rem' }}>⋮</Box>
                  </IconButton>
                </ListItem>
                {index < todos.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
      
      {/* タスクメニュー */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditTask}>
          <Box component="span" sx={{ fontSize: '1.2rem', mr: 1 }}>✏️</Box>
          編集
        </MenuItem>
        <MenuItem onClick={handleDeleteTask}>
          <Box component="span" sx={{ fontSize: '1.2rem', mr: 1 }}>🗑️</Box>
          削除
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TodoList;
