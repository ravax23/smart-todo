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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTodo = {
      title: title.trim(),
      completed: false,
      due: dueDate || null,
      categoryId: categoryId || null,
    };

    onAddTodo(newTodo);
    setTitle('');
    setDueDate('');
    if (!initialCategoryId) {
      setCategoryId('');
    }
  };

  const handleCategoryClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCategoryClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'category-popover' : undefined;

  return (
    <Box sx={{ mb: 3 }}>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          placeholder="新しいタスクを追加..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          variant="outlined"
          size="medium"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              backgroundColor: 'background.paper',
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-describedby={id}
                  onClick={handleCategoryClick}
                  color={categoryId ? 'primary' : 'default'}
                  size="small"
                  sx={{ mr: 0.5 }}
                >
                  <LabelIcon />
                </IconButton>
                <IconButton
                  onClick={() => document.getElementById('date-picker').showPicker()}
                  color={dueDate ? 'primary' : 'default'}
                  size="small"
                  sx={{ mr: 0.5 }}
                >
                  <CalendarTodayIcon />
                </IconButton>
                <IconButton
                  type="submit"
                  color="primary"
                  disabled={!title.trim()}
                  size="small"
                >
                  <AddIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <input
          id="date-picker"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
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
            <InputLabel>カテゴリ</InputLabel>
            <Select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                handleCategoryClose();
              }}
              label="カテゴリ"
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
    </Box>
  );
}

export default AddTodo;
