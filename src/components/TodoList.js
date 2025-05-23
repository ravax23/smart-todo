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
  Divider,
  Menu,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useCategories } from '../contexts/CategoryContext';

function TodoList({ todos, onToggle, onDelete }) {
  const [showCompleted, setShowCompleted] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const { categories } = useCategories();

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    });
  };

  // 完了/未完了でフィルタリング
  const filteredTodos = todos.filter((todo) => {
    if (!showCompleted && todo.completed) return false;
    return true;
  });

  // 日付が近い順にソート
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    // 期限なしは後ろに
    if (!a.due && !b.due) return 0;
    if (!a.due) return 1;
    if (!b.due) return -1;
    
    return new Date(a.due) - new Date(b.due);
  });

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {filteredTodos.length} 件のタスク
        </Typography>
        
        <Box>
          <IconButton 
            size="small" 
            onClick={handleMenuClick}
            sx={{ color: 'text.secondary' }}
          >
            <FilterListIcon fontSize="small" />
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem sx={{ px: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showCompleted}
                    onChange={(e) => setShowCompleted(e.target.checked)}
                    size="small"
                  />
                }
                label="完了したタスクを表示"
              />
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {sortedTodos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            タスクがありません
          </Typography>
        </Box>
      ) : (
        <List disablePadding>
          {sortedTodos.map((todo) => {
            const category = categories.find(c => c.id === todo.categoryId) || { name: '', color: '#757575' };
            
            return (
              <React.Fragment key={todo.id}>
                <ListItem
                  disablePadding
                  sx={{
                    py: 1,
                    px: 0.5,
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Checkbox
                      edge="start"
                      checked={todo.completed}
                      onChange={() => onToggle(todo.id)}
                      disableRipple
                      sx={{
                        color: todo.categoryId ? category.color : 'rgba(0, 0, 0, 0.26)',
                        '&.Mui-checked': {
                          color: todo.categoryId ? category.color : 'primary.main',
                        },
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        sx={{
                          textDecoration: todo.completed ? 'line-through' : 'none',
                          color: todo.completed ? 'text.secondary' : 'text.primary',
                          fontWeight: todo.completed ? 'normal' : 500,
                        }}
                      >
                        {todo.title}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 1 }}>
                        {todo.due && (
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                            }}
                          >
                            <CalendarTodayIcon sx={{ mr: 0.5, fontSize: '0.875rem' }} />
                            {formatDate(todo.due)}
                          </Box>
                        )}
                        {todo.categoryId && (
                          <Chip 
                            label={category.name} 
                            size="small" 
                            sx={{ 
                              height: '20px',
                              fontSize: '0.7rem',
                              bgcolor: `${category.color}15`, 
                              color: category.color,
                              border: `1px solid ${category.color}30`,
                            }} 
                          />
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="delete" 
                      onClick={() => onDelete(todo.id)}
                      size="small"
                      sx={{ color: 'text.secondary' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Box>
  );
}

export default TodoList;
