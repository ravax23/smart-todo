import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Typography,
  Badge,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Today as TodayIcon,
  EventNote as EventNoteIcon,
  History as HistoryIcon,
  FormatListBulleted as ListIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useCategories } from '../contexts/CategoryContext';

function Sidebar({ onNavigate, selectedCategory, selectedDateFilter, todos }) {
  const { categories } = useCategories();

  // 日付別のタスク数をカウント
  const getTodoCountByDate = (filter) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const afterTomorrow = new Date(today);
    afterTomorrow.setDate(afterTomorrow.getDate() + 2);

    switch (filter) {
      case 'today':
        return todos.filter(todo => {
          if (!todo.due) return false;
          const dueDate = new Date(todo.due);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime();
        }).length;
      case 'tomorrow':
        return todos.filter(todo => {
          if (!todo.due) return false;
          const dueDate = new Date(todo.due);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === tomorrow.getTime();
        }).length;
      case 'after_tomorrow':
        return todos.filter(todo => {
          if (!todo.due) return false;
          const dueDate = new Date(todo.due);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === afterTomorrow.getTime();
        }).length;
      case 'past':
        return todos.filter(todo => {
          if (!todo.due) return false;
          const dueDate = new Date(todo.due);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() < today.getTime();
        }).length;
      default:
        return todos.length;
    }
  };

  // カテゴリ別のタスク数をカウント
  const getTodoCountByCategory = (categoryId) => {
    return todos.filter(todo => todo.categoryId === categoryId).length;
  };

  return (
    <Box 
      sx={{ 
        width: 250, 
        bgcolor: 'background.paper',
        borderRight: '1px solid #e0e0e0',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto'
      }}
    >
      <Box sx={{ p: 2, pt: 3 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600, 
            color: 'primary.main',
            mb: 2
          }}
        >
          Todo App
        </Typography>
      </Box>

      <List sx={{ px: 1 }}>
        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => onNavigate('todos')}
            selected={selectedDateFilter === 'all' && !selectedCategory}
            sx={{ 
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'rgba(33, 150, 243, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(33, 150, 243, 0.12)',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <ListIcon fontSize="small" color="action" />
            </ListItemIcon>
            <ListItemText primary="すべてのタスク" />
            <Badge 
              badgeContent={todos.length} 
              color="primary"
              sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem' } }}
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => onNavigate('date_today')}
            selected={selectedDateFilter === 'today'}
            sx={{ 
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'rgba(33, 150, 243, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(33, 150, 243, 0.12)',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <TodayIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="今日" />
            <Badge 
              badgeContent={getTodoCountByDate('today')} 
              color="error"
              sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem' } }}
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => onNavigate('date_tomorrow')}
            selected={selectedDateFilter === 'tomorrow'}
            sx={{ 
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'rgba(33, 150, 243, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(33, 150, 243, 0.12)',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CalendarIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary="明日" />
            <Badge 
              badgeContent={getTodoCountByDate('tomorrow')} 
              color="primary"
              sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem' } }}
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => onNavigate('date_after_tomorrow')}
            selected={selectedDateFilter === 'after_tomorrow'}
            sx={{ 
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'rgba(33, 150, 243, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(33, 150, 243, 0.12)',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <EventNoteIcon fontSize="small" color="secondary" />
            </ListItemIcon>
            <ListItemText primary="明後日" />
            <Badge 
              badgeContent={getTodoCountByDate('after_tomorrow')} 
              color="secondary"
              sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem' } }}
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => onNavigate('date_past')}
            selected={selectedDateFilter === 'past'}
            sx={{ 
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'rgba(33, 150, 243, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(33, 150, 243, 0.12)',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <HistoryIcon fontSize="small" color="action" />
            </ListItemIcon>
            <ListItemText primary="過去のタスク" />
            <Badge 
              badgeContent={getTodoCountByDate('past')} 
              color="default"
              sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem' } }}
            />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider sx={{ my: 1.5 }} />

      <Box sx={{ px: 3, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" color="text.secondary">
          カテゴリ
        </Typography>
        <Typography 
          variant="caption" 
          color="primary" 
          sx={{ 
            cursor: 'pointer',
            fontWeight: 500,
            '&:hover': { textDecoration: 'underline' }
          }}
          onClick={() => onNavigate('categories')}
        >
          管理
        </Typography>
      </Box>

      <List sx={{ px: 1, pb: 2 }}>
        {categories.map((category) => (
          <ListItem disablePadding key={category.id}>
            <ListItemButton
              onClick={() => onNavigate('category', category.id)}
              selected={selectedCategory === category.id}
              sx={{ 
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'rgba(33, 150, 243, 0.08)',
                  '&:hover': {
                    bgcolor: 'rgba(33, 150, 243, 0.12)',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '4px',
                    bgcolor: category.color,
                  }}
                />
              </ListItemIcon>
              <ListItemText primary={category.name} />
              <Badge 
                badgeContent={getTodoCountByCategory(category.id)} 
                color="default"
                sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem' } }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export default Sidebar;
