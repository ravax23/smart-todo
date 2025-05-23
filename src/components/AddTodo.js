import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  InputAdornment,
  IconButton,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon from '@mui/icons-material/Add';

function AddTodo({ onAddTodo }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTodo = {
      title: title.trim(),
      completed: false,
      due: dueDate || null,
    };

    onAddTodo(newTodo);
    setTitle('');
    setDueDate('');
    setShowDatePicker(false);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={showDatePicker ? 6 : 9}>
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
          <Grid item xs={3}>
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
