import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon from '@mui/icons-material/Add';
import { useCategories } from '../contexts/CategoryContext';

function AddTodo({ onAddTodo, initialCategoryId = null }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState(initialCategoryId || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
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
    setShowDatePicker(false);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={showDatePicker ? 4 : 6}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="新しいタスクを追加"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    color={showDatePicker ? 'primary' : 'default'}
                  >
                    <CalendarTodayIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        
        {showDatePicker && (
          <Grid item xs={2}>
            <TextField
              fullWidth
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
        )}
        
        <Grid item xs={3}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>カテゴリ</InputLabel>
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              label="カテゴリ"
            >
              <MenuItem value="">なし</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={showDatePicker ? 3 : 3}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            startIcon={<AddIcon />}
            disabled={!title.trim()}
          >
            追加
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}

export default AddTodo;
