import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  Divider, 
  CircularProgress, 
  Alert,
  TextField,
  IconButton,
  Checkbox,
  Menu,
  MenuItem
} from '@mui/material';
import { useTodo } from '../contexts/TodoContext';
import { format, parseISO, isValid } from 'date-fns';
import { ja } from 'date-fns/locale';

// カテゴリ別の色を定義
const categoryColors = {
  'work-hisys': '#e74c3c',
  'work-internal': '#3498db',
  'personal': '#2ecc71'
};

const TodoList = () => {
  const { todos, loading, error } = useTodo();
  const [taskItems, setTaskItems] = useState([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  // メニューを開く
  const handleMenuOpen = (event, task) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  // メニューを閉じる
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedTask(null);
  };

  // カテゴリ変更
  const handleCategoryChange = (category) => {
    if (selectedTask) {
      const updatedTasks = taskItems.map(task => 
        task.id === selectedTask.id ? { ...task, category } : task
      );
      setTaskItems(updatedTasks);
    }
    handleMenuClose();
  };

  // タスクの順序変更
  const moveTask = (fromIndex, toIndex) => {
    const updatedTasks = [...taskItems];
    const [movedTask] = updatedTasks.splice(fromIndex, 1);
    updatedTasks.splice(toIndex, 0, movedTask);
    setTaskItems(updatedTasks);
  };

  // ドラッグ開始時の処理
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
  };

  // ドラッグオーバー時の処理
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // ドロップ時の処理
  const handleDrop = (e, toIndex) => {
    const fromIndex = e.dataTransfer.getData('text/plain');
    moveTask(parseInt(fromIndex), toIndex);
  };

  // コンポーネントがマウントされたときにtodosをtaskItemsに設定
  React.useEffect(() => {
    if (todos.length > 0) {
      // カテゴリを追加
      const tasksWithCategory = todos.map(todo => {
        let category = 'personal';
        if (todo.title.includes('HISYS') || todo.title.includes('クライアント')) {
          category = 'work-hisys';
        } else if (todo.title.includes('社内') || todo.title.includes('仕様書')) {
          category = 'work-internal';
        }
        return { ...todo, category };
      });
      setTaskItems(tasksWithCategory);
    }
  }, [todos]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  // カテゴリ名を表示用に変換する関数
  const getCategoryLabel = (category) => {
    switch (category) {
      case 'work-hisys':
        return 'HISYS';
      case 'work-internal':
        return '社内';
      case 'personal':
        return '個人';
      default:
        return '';
    }
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          仕事（HISYS）
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', bgcolor: '#f9fafb', p: '8px 16px', borderRadius: 1 }}>
          {format(new Date(), 'yyyy年MM月dd日(E)', { locale: ja })}
        </Typography>
      </Box>

      {/* 新規タスク入力フィールド */}
      <Box sx={{ position: 'relative', mb: 3 }}>
        <TextField
          fullWidth
          placeholder="新しいタスクを追加"
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              pl: 4,
              bgcolor: '#f9fafb',
            }
          }}
        />
        <Box sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'text.secondary', fontSize: '1.5rem' }}>
          +
        </Box>
      </Box>
      
      {/* タスク一覧 */}
      {taskItems.length === 0 ? (
        <Box sx={{ textAlign: 'center', my: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <Typography variant="body1" color="text.secondary">
            タスクが見つかりません。
          </Typography>
        </Box>
      ) : (
        <Box sx={{ 
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <List sx={{ p: 0 }}>
            {taskItems.map((task, index) => (
              <React.Fragment key={task.id}>
                <ListItem 
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  sx={{ 
                    py: 1.5,
                    px: 2,
                    bgcolor: `rgba(${task.category === 'work-hisys' ? '231, 76, 60' : task.category === 'work-internal' ? '52, 152, 219' : '46, 204, 113'}, 0.05)`,
                    borderLeft: `4px solid ${categoryColors[task.category]}`,
                    '&:hover': { 
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s',
                      cursor: 'grab'
                    },
                    '&:active': {
                      cursor: 'grabbing'
                    }
                  }}
                >
                  <Checkbox 
                    checked={task.status === 'completed'} 
                    sx={{ 
                      mr: 1,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      '&.Mui-checked': {
                        color: categoryColors[task.category],
                      }
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="body1" 
                      sx={{
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                        color: task.status === 'completed' ? 'text.secondary' : 'text.primary',
                        mb: 0.5,
                        fontWeight: 500,
                        fontSize: '0.9375rem'
                      }}
                    >
                      {task.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: 'text.secondary' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '4px' }}>📅</span>
                        {task.startDate ? format(parseISO(task.startDate), 'MM月dd日', { locale: ja }) : '期限なし'}
                      </Box>
                      <Box 
                        sx={{ 
                          ml: 2, 
                          bgcolor: `rgba(${task.category === 'work-hisys' ? '231, 76, 60' : task.category === 'work-internal' ? '52, 152, 219' : '46, 204, 113'}, 0.1)`,
                          color: categoryColors[task.category],
                          px: 1,
                          py: 0.25,
                          borderRadius: '1rem',
                          fontSize: '0.6875rem'
                        }}
                      >
                        {getCategoryLabel(task.category)}
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    '.MuiListItem-root:hover &': {
                      opacity: 1
                    }
                  }}>
                    <IconButton 
                      size="small" 
                      sx={{ color: 'text.secondary' }}
                      onClick={(e) => handleMenuOpen(e, task)}
                    >
                      ✏️
                    </IconButton>
                    <IconButton size="small" sx={{ color: 'text.secondary' }}>
                      🗑️
                    </IconButton>
                  </Box>
                </ListItem>
                {index < taskItems.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}

      {/* カテゴリ変更メニュー */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleCategoryChange('work-hisys')}>
          <Box 
            component="span" 
            sx={{ 
              width: 10, 
              height: 10, 
              borderRadius: '50%', 
              bgcolor: categoryColors['work-hisys'],
              display: 'inline-block',
              mr: 1.5
            }} 
          />
          HISYS
        </MenuItem>
        <MenuItem onClick={() => handleCategoryChange('work-internal')}>
          <Box 
            component="span" 
            sx={{ 
              width: 10, 
              height: 10, 
              borderRadius: '50%', 
              bgcolor: categoryColors['work-internal'],
              display: 'inline-block',
              mr: 1.5
            }} 
          />
          社内
        </MenuItem>
        <MenuItem onClick={() => handleCategoryChange('personal')}>
          <Box 
            component="span" 
            sx={{ 
              width: 10, 
              height: 10, 
              borderRadius: '50%', 
              bgcolor: categoryColors['personal'],
              display: 'inline-block',
              mr: 1.5
            }} 
          />
          個人
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TodoList;
