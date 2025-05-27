import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Popover,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  RadioGroup,
  Radio,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LabelIcon from '@mui/icons-material/Label';
import { useCategories } from '../contexts/CategoryContext';

function AddTodo({ onAddTodo, initialCategoryId = null }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState(initialCategoryId || '');
  const [anchorEl, setAnchorEl] = useState(null);
  const { categories } = useCategories();
  
  // 新規タスク作成ダイアログ用の状態
  const [openDialog, setOpenDialog] = useState(false);
  const [taskDetails, setTaskDetails] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // 新規タスク作成ダイアログを開く
    setOpenDialog(true);
  };

  const handleCategoryClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCategoryClose = () => {
    setAnchorEl(null);
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

  // タスクを保存
  const handleSaveTask = () => {
    if (!taskDetails.title.trim()) return;

    const newTodo = {
      title: taskDetails.title.trim(),
      notes: taskDetails.description,
      completed: false,
      due: taskDetails.dueDate || dueDate || null,
      categoryId: categoryId || null,
      priority: taskDetails.priority
    };

    onAddTodo(newTodo);
    
    // フォームをリセット
    setTitle('');
    setDueDate('');
    setTaskDetails({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium'
    });
    
    if (!initialCategoryId) {
      setCategoryId('');
    }
    
    // ダイアログを閉じる
    setOpenDialog(false);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'mylist-popover' : undefined;

  return (
    <Box sx={{ mb: 2, mt: 1 }}>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          placeholder="新しいタスクを追加..."
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setTaskDetails({...taskDetails, title: e.target.value});
          }}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '4px',
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
              height: '40px',
            },
            opacity: 0.85,
            '&:hover': {
              opacity: 1,
            },
            transition: 'opacity 0.2s ease-in-out',
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-describedby={id}
                  onClick={handleCategoryClick}
                  color={categoryId ? 'primary' : 'default'}
                  size="small"
                  sx={{ 
                    mr: 0.5,
                    padding: '4px',
                    opacity: 0.7,
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    }
                  }}
                >
                  <LabelIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => document.getElementById('date-picker').showPicker()}
                  color={dueDate ? 'primary' : 'default'}
                  size="small"
                  sx={{ 
                    mr: 0.5,
                    padding: '4px',
                    opacity: 0.7,
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    }
                  }}
                >
                  <CalendarTodayIcon fontSize="small" />
                </IconButton>
                <IconButton
                  type="submit"
                  color="primary"
                  size="small"
                  sx={{ 
                    padding: '4px',
                    opacity: 0.7,
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    }
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <input
          id="date-picker"
          type="date"
          value={dueDate}
          onChange={(e) => {
            setDueDate(e.target.value);
            setTaskDetails({...taskDetails, dueDate: e.target.value});
          }}
          style={{ display: 'none' }}
        />
      </form>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleCategoryClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, width: 250 }}>
          <FormControl fullWidth size="small">
            <InputLabel>マイリスト</InputLabel>
            <Select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                handleCategoryClose();
              }}
              label="マイリスト"
            >
              <MenuItem value="">なし</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      borderRadius: '3px',
                      bgcolor: category.color,
                      mr: 1,
                    }}
                  />
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Popover>

      {/* 新規タスク作成ダイアログ */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>新規タスクの作成</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="タイトル"
              fullWidth
              value={taskDetails.title || title}
              onChange={handleTaskDetailChange('title')}
              required
              autoFocus
            />
            
            <TextField
              label="内容"
              fullWidth
              multiline
              rows={4}
              value={taskDetails.description}
              onChange={handleTaskDetailChange('description')}
            />
            
            <TextField
              label="期限"
              type="date"
              fullWidth
              value={taskDetails.dueDate || dueDate}
              onChange={handleTaskDetailChange('dueDate')}
              InputLabelProps={{
                shrink: true,
              }}
            />
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>優先度</Typography>
              <RadioGroup
                row
                value={taskDetails.priority}
                onChange={handleTaskDetailChange('priority')}
              >
                <FormControlLabel value="low" control={<Radio />} label="低" />
                <FormControlLabel value="medium" control={<Radio />} label="中" />
                <FormControlLabel value="high" control={<Radio />} label="高" />
              </RadioGroup>
            </Box>
            
            <FormControl fullWidth>
              <InputLabel>マイリスト</InputLabel>
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                label="マイリスト"
              >
                <MenuItem value="">なし</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-block',
                        width: 12,
                        height: 12,
                        borderRadius: '3px',
                        bgcolor: category.color,
                        mr: 1,
                      }}
                    />
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button 
            onClick={handleSaveTask} 
            variant="contained" 
            color="primary"
            disabled={!taskDetails.title && !title}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AddTodo;
