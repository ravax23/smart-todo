import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  IconButton,
  Typography,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

function TodoList({ todos, onToggle, onDelete }) {
  const [filter, setFilter] = useState('all');

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'all') return true;
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">タスク一覧</Typography>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
          <InputLabel>フィルター</InputLabel>
          <Select value={filter} onChange={handleFilterChange} label="フィルター">
            <MenuItem value="all">すべて</MenuItem>
            <MenuItem value="active">未完了</MenuItem>
            <MenuItem value="completed">完了済み</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {filteredTodos.length === 0 ? (
        <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
          タスクがありません
        </Typography>
      ) : (
        <List>
          {filteredTodos.map((todo) => (
            <ListItem
              key={todo.id}
              dense
              button
              onClick={() => onToggle(todo.id)}
              sx={{
                bgcolor: 'background.paper',
                mb: 1,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={todo.completed}
                  tabIndex={-1}
                  disableRipple
                  color="primary"
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="body1"
                    sx={{
                      textDecoration: todo.completed ? 'line-through' : 'none',
                      color: todo.completed ? 'text.secondary' : 'text.primary',
                    }}
                  >
                    {todo.title}
                  </Typography>
                }
                secondary={
                  todo.due && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <CalendarTodayIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.875rem' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(todo.due)}
                      </Typography>
                    </Box>
                  )
                }
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" aria-label="delete" onClick={() => onDelete(todo.id)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Chip
          label={`全タスク: ${todos.length}`}
          variant="outlined"
          size="small"
        />
        <Chip
          label={`完了: ${todos.filter((todo) => todo.completed).length}`}
          color="primary"
          variant="outlined"
          size="small"
        />
      </Box>
    </Box>
  );
}

export default TodoList;
