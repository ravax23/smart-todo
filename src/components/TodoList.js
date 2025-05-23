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
import { useCategories } from '../contexts/CategoryContext';

function TodoList({ todos, onToggle, onDelete }) {
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const { categories } = useCategories();

  const filteredTodos = todos.filter((todo) => {
    // ステータスフィルター
    if (filter !== 'all') {
      if (filter === 'active' && todo.completed) return false;
      if (filter === 'completed' && !todo.completed) return false;
    }
    
    // カテゴリフィルター
    if (categoryFilter !== 'all' && todo.categoryId !== categoryFilter) {
      return false;
    }
    
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

  const handleCategoryFilterChange = (event) => {
    setCategoryFilter(event.target.value);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">タスク一覧</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>フィルター</InputLabel>
            <Select value={filter} onChange={handleFilterChange} label="フィルター">
              <MenuItem value="all">すべて</MenuItem>
              <MenuItem value="active">未完了</MenuItem>
              <MenuItem value="completed">完了済み</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>カテゴリ</InputLabel>
            <Select 
              value={categoryFilter} 
              onChange={handleCategoryFilterChange} 
              label="カテゴリ"
            >
              <MenuItem value="all">すべて</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {filteredTodos.length === 0 ? (
        <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
          タスクがありません
        </Typography>
      ) : (
        <List>
          {filteredTodos.map((todo) => {
            const category = categories.find(c => c.id === todo.categoryId) || { name: '', color: '#757575' };
            
            return (
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
                  borderLeft: '4px solid',
                  borderLeftColor: todo.categoryId ? category.color : 'divider',
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
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 1 }}>
                      {todo.due && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarTodayIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.875rem' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(todo.due)}
                          </Typography>
                        </Box>
                      )}
                      {todo.categoryId && (
                        <Chip 
                          label={category.name} 
                          size="small" 
                          sx={{ 
                            bgcolor: `${category.color}20`, 
                            color: category.color,
                            height: '20px'
                          }} 
                        />
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" aria-label="delete" onClick={(e) => {
                    e.stopPropagation();
                    onDelete(todo.id);
                  }}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
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
