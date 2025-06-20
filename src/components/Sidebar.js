import React, { useState, useMemo } from 'react';
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
import { isToday, parseISO, startOfDay, isBefore, isTomorrow } from 'date-fns';

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

const Sidebar = ({ closeSidebar, isMobile }) => {
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
    searchTasks,
    allTodos, // 全てのタスク（フィルタリング前）
    todos // フィルタリング後のタスク
  } = useTodo();
  const [editingListId, setEditingListId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingNewList, setIsAddingNewList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  // フィルターリスト
  const filters = [
    { id: 'today', name: '今日', icon: '📅' },
    { id: 'after-tomorrow', name: '今週', icon: '📆' }, // 日曜日から土曜日までのタスク
    { id: 'past', name: '期限切れ', icon: '⏱️' },
    { id: 'starred', name: 'スター付き', icon: '⭐' },
    { id: 'all', name: 'すべて', icon: '📋' },
  ];

  // フィルター別のタスク数を計算（マイリスト横断で一貫した値を表示）
  const filterCounts = useMemo(() => {
    // 未完了のタスクのみをフィルタリング
    const incompleteTodos = allTodos.filter(todo => todo.status !== 'completed');
    
    // 各フィルターの件数を計算
    const counts = {};
    
    // すべてのタスク（未完了のみ）
    counts['all'] = incompleteTodos.length;
    
    // 今日のタスク（未完了のみ）
    counts['today'] = incompleteTodos.filter(todo => {
      if (!todo.startDate) return false;
      try {
        const date = parseISO(todo.startDate);
        return isToday(date);
      } catch (e) {
        return false;
      }
    }).length;
    
    // 今週のタスク（未完了のみ）
    counts['after-tomorrow'] = incompleteTodos.filter(todo => {
      if (!todo.startDate) return false;
      try {
        // 今週（日曜日から土曜日まで）のタスクを表示
        const date = parseISO(todo.startDate);
        const today = new Date();
        const startOfWeek = startOfDay(new Date(today));
        // 今日の曜日を取得（0: 日曜日, 1: 月曜日, ..., 6: 土曜日）
        const dayOfWeek = today.getDay();
        // 日曜日まで戻る
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        
        // 週の終わり（土曜日）
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        // タスクの日付が今週の範囲内かチェック
        return date >= startOfWeek && date <= endOfWeek;
      } catch (e) {
        return false;
      }
    }).length;
    
    // 期限切れのタスク（未完了のみ）
    counts['past'] = incompleteTodos.filter(todo => {
      if (!todo.startDate) return false;
      try {
        const date = parseISO(todo.startDate);
        return isBefore(date, startOfDay(new Date()));
      } catch (e) {
        return false;
      }
    }).length;
    
    // スター付きのタスク（未完了のみ）
    counts['starred'] = incompleteTodos.filter(todo => todo.starred === true).length;
    
    return counts;
  }, [allTodos]); // allTodosが変更されたときだけ再計算

  // マイリスト別のタスク数を計算
  const listCounts = useMemo(() => {
    const counts = {};
    
    // 未完了のタスクのみをフィルタリング
    const incompleteTodos = allTodos.filter(todo => todo.status !== 'completed');
    
    // 各マイリストの未完了タスク数を計算
    taskLists.forEach(list => {
      counts[list.id] = incompleteTodos.filter(todo => todo.listId === list.id).length;
    });
    
    return counts;
  }, [allTodos, taskLists]); // allTodosまたはtaskListsが変更されたときだけ再計算

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
  
  // フィルターをクリックしたときの処理
  const handleFilterClick = (filterId) => {
    selectFilter(filterId);
    if (isMobile) {
      closeSidebar();
    }
  };

  // タスクリストをクリックしたときの処理
  const handleTaskListClick = (listId) => {
    selectTaskList(listId);
    if (isMobile) {
      closeSidebar();
    }
  };

  return (
    <Box sx={{ 
      width: 320, 
      bgcolor: 'white', 
      borderRight: '1px solid #e0e0e0', // 常に縦ラインを表示
      display: 'flex',
      flexDirection: 'column',
      p: 2,
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden' // 横スクロール禁止
    }}>
      {/* アプリタイトル */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: isMobile ? 'space-between' : 'flex-start',
        alignItems: 'center',
        mb: 3,
        pl: 1 // フィルターという文字と同じ位置に合わせる
      }}>
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
            fontWeight: 500, // 700から500に変更してより細く
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
        
        {/* モバイル用の閉じるボタン */}
        {isMobile && (
          <IconButton
            onClick={closeSidebar}
            sx={{
              color: 'text.secondary',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
            }}
          >
            <Box component="span" sx={{ fontSize: '1.5rem' }}>✕</Box>
          </IconButton>
        )}
      </Box>
      
      {/* 検索フィールド - モバイル時は非表示 */}
      {!isMobile && (
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
      )}

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
            onClick={() => handleFilterClick(filter.id)}
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
              primary={`${filter.name}`}
              primaryTypographyProps={{ 
                fontSize: '0.9375rem',
                display: 'inline',
              }}
              secondary={`  (${filterCounts[filter.id] || 0})`}
              secondaryTypographyProps={{ 
                fontSize: '0.75rem', 
                color: 'text.disabled',
                display: 'inline',
                marginLeft: '4px',
              }}
              sx={{ display: 'flex', alignItems: 'center' }}
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
      
      <List sx={{ p: 0 }}>
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
            onClick={() => handleTaskListClick(list.id)}
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
                primaryTypographyProps={{ 
                  fontSize: '0.9375rem',
                  display: 'inline',
                  className: isMobile ? 'mylist-title-mobile' : ''
                }}
                secondary={`  (${listCounts[list.id] || 0})`}
                secondaryTypographyProps={{ 
                  fontSize: '0.75rem', 
                  color: 'text.disabled',
                  display: 'inline',
                  marginLeft: '4px',
                }}
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
