import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useTodo } from '../contexts/TodoContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

const SearchBar = () => {
  const { 
    searchTasks, 
    taskLists, 
    selectedTaskList,
    createTask
  } = useTodo();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [taskDetails, setTaskDetails] = useState({
    title: '',
    description: '',
    dueDate: null,
    priority: 'normal',
    categoryId: ''
  });

  // 検索フィールドの変更を処理
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // 検索クエリをTodoContextの検索関数に渡す
    searchTasks(e.target.value);
  };

  // 新規タスク追加ダイアログを開く
  const handleOpenDialog = () => {
    setOpenDialog(true);
    setTaskDetails({
      title: '',
      description: '',
      dueDate: null,
      priority: 'normal',
      categoryId: selectedTaskList
    });
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // タスク詳細の入力を処理
  const handleTaskDetailChange = (field) => (e) => {
    setTaskDetails({
      ...taskDetails,
      [field]: e.target.value
    });
  };

  // 日付の変更を処理
  const handleDateChange = (e) => {
    setTaskDetails({
      ...taskDetails,
      dueDate: e.target.value
    });
  };

  // タスクを保存
  const handleSaveTask = async () => {
    try {
      if (!taskDetails.title.trim()) {
        return; // タイトルが空の場合は何もしない
      }

      // タスクデータを作成
      const taskData = {
        title: taskDetails.title,
        notes: taskDetails.description || '',
        due: taskDetails.dueDate ? new Date(taskDetails.dueDate).toISOString() : null,
        starred: false,
        priority: taskDetails.priority
      };

      // タスクを作成
      const listId = taskDetails.categoryId || selectedTaskList;
      await createTask(taskData, listId);
      
      handleCloseDialog();
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      mb: 3,
      mt: 2,
      px: 4
    }}>
      {/* 検索フィールド */}
      <Box sx={{ position: 'relative', flexGrow: 1, mr: 2 }}>
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

      {/* 新規タスク追加ボタン */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpenDialog}
        startIcon={<Box component="span" sx={{ fontSize: '1.2rem' }}>➕</Box>}
        sx={{ 
          borderRadius: 2,
          textTransform: 'none',
          px: 3
        }}
      >
        新しいタスク
      </Button>

      {/* 新規タスク追加ダイアログ */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>新しいタスク</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="タイトル"
              fullWidth
              value={taskDetails.title}
              onChange={handleTaskDetailChange('title')}
              autoFocus
            />
            
            <TextField
              label="説明"
              fullWidth
              multiline
              rows={3}
              value={taskDetails.description}
              onChange={handleTaskDetailChange('description')}
            />
            
            <TextField
              label="期限"
              type="date"
              fullWidth
              value={taskDetails.dueDate}
              onChange={handleDateChange}
              InputLabelProps={{
                shrink: true,
              }}
            />
            
            <FormControl fullWidth>
              <InputLabel>優先度</InputLabel>
              <Select
                value={taskDetails.priority}
                label="優先度"
                onChange={handleTaskDetailChange('priority')}
              >
                <MenuItem value="low">低</MenuItem>
                <MenuItem value="normal">中</MenuItem>
                <MenuItem value="high">高</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>カテゴリ</InputLabel>
              <Select
                value={taskDetails.categoryId}
                label="カテゴリ"
                onChange={handleTaskDetailChange('categoryId')}
              >
                {taskLists.map(list => (
                  <MenuItem key={list.id} value={list.id}>{list.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleSaveTask} variant="contained" color="primary">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SearchBar;
