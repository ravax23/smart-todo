import React from 'react';
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText, InputBase, Paper } from '@mui/material';
import { useTodo } from '../contexts/TodoContext';

const Sidebar = () => {
  const { taskLists, selectedTaskList, selectTaskList } = useTodo();

  // フィルターリスト
  const filters = [
    { id: 'today', name: 'Today', icon: '📅' },
    { id: 'tomorrow', name: 'Tomorrow', icon: '📆' },
    { id: 'after-tomorrow', name: 'After tomorrow', icon: '📆' },
    { id: 'past', name: 'Past', icon: '⏱️' },
    { id: 'all', name: 'All', icon: '📋' },
  ];

  // カテゴリ別の色を定義
  const categoryColors = {
    'work-hisys': '#e74c3c',
    'work-internal': '#3498db',
    'personal': '#2ecc71'
  };

  // タスクリストのカテゴリを判定する関数
  const getListCategory = (list) => {
    // ここでは仮のロジックとして、リストのタイトルに基づいてカテゴリを判定
    if (list.title.includes('HISYS')) {
      return 'work-hisys';
    } else if (list.title.includes('社内')) {
      return 'work-internal';
    } else {
      return 'personal';
    }
  };

  return (
    <Box sx={{ 
      width: 300, 
      bgcolor: 'background.paper', 
      borderRight: '1px solid #e5e7eb',
      p: 3,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* アプリロゴとタイトル */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ 
          width: 40, 
          height: 40, 
          bgcolor: 'primary.main', 
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          mr: 2
        }}>
          T
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Todo App
        </Typography>
      </Box>

      {/* 検索ボックス */}
      <Box sx={{ position: 'relative', mb: 3 }}>
        <Box sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'text.secondary' }}>
          🔍
        </Box>
        <InputBase
          placeholder="検索"
          sx={{
            width: '100%',
            bgcolor: 'background.default',
            border: '1px solid #e5e7eb',
            borderRadius: 1,
            p: '8px 12px 8px 36px',
            fontSize: '0.875rem',
            '&:focus-within': {
              borderColor: 'secondary.main',
              boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.2)',
            }
          }}
        />
      </Box>

      {/* フィルターリスト */}
      <Typography variant="caption" sx={{ 
        textTransform: 'uppercase', 
        letterSpacing: '0.05em', 
        color: 'text.secondary',
        mb: 1,
        pl: 1
      }}>
        フィルター
      </Typography>
      <List sx={{ mb: 2, p: 0 }}>
        {filters.map((filter) => (
          <ListItem
            key={filter.id}
            button
            selected={filter.id === 'today'}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              py: 1,
              '&.Mui-selected': {
                bgcolor: 'primary.light',
                color: 'primary.main',
                fontWeight: 500,
              },
              '&:hover': {
                bgcolor: 'background.default',
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Box component="span" sx={{ fontSize: '1.2rem' }}>{filter.icon}</Box>
            </ListItemIcon>
            <ListItemText primary={filter.name} primaryTypographyProps={{ fontSize: '0.9375rem' }} />
          </ListItem>
        ))}
      </List>

      {/* タスクリスト */}
      <Typography variant="caption" sx={{ 
        textTransform: 'uppercase', 
        letterSpacing: '0.05em', 
        color: 'text.secondary',
        mb: 1,
        pl: 1
      }}>
        マイリスト
      </Typography>
      <List sx={{ p: 0 }}>
        {taskLists && taskLists.map((list) => {
          const category = getListCategory(list);
          return (
            <ListItem
              key={list.id}
              button
              selected={list.id === selectedTaskList}
              onClick={() => selectTaskList(list.id)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                py: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  fontWeight: 500,
                },
                '&:hover': {
                  bgcolor: 'background.default',
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Box 
                  component="span" 
                  sx={{ 
                    width: 10, 
                    height: 10, 
                    borderRadius: '50%', 
                    bgcolor: categoryColors[category],
                    display: 'inline-block'
                  }} 
                />
              </ListItemIcon>
              <ListItemText primary={list.title} primaryTypographyProps={{ fontSize: '0.9375rem' }} />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default Sidebar;
