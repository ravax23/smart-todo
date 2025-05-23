import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Divider, CircularProgress, Alert } from '@mui/material';
import { useTodo } from '../contexts/TodoContext';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

const TodoList = () => {
  const { todos, loading, error } = useTodo();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  if (todos.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', my: 4 }}>
        <Typography variant="body1">
          予定が見つかりません。
        </Typography>
      </Box>
    );
  }

  // 日付ごとにイベントをグループ化
  const groupedTodos = todos.reduce((acc, todo) => {
    let dateStr = '';
    
    if (todo.startDate) {
      try {
        // ISO形式の日付文字列をパース
        const date = parseISO(todo.startDate);
        // 日本語の日付フォーマット
        dateStr = format(date, 'yyyy年MM月dd日(E)', { locale: ja });
      } catch (e) {
        dateStr = '日付なし';
      }
    } else {
      dateStr = '日付なし';
    }
    
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    
    acc[dateStr].push(todo);
    return acc;
  }, {});

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        今後の予定
      </Typography>
      
      {Object.entries(groupedTodos).map(([date, dateTodos]) => (
        <Box key={date} sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ bgcolor: 'primary.main', color: 'white', p: 1 }}>
            {date}
          </Typography>
          
          <List>
            {dateTodos.map((todo) => {
              // 時間の表示
              let timeStr = '';
              if (todo.startDate) {
                try {
                  const date = parseISO(todo.startDate);
                  timeStr = format(date, 'HH:mm');
                } catch (e) {
                  timeStr = '';
                }
              }
              
              return (
                <React.Fragment key={todo.id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {timeStr && (
                            <Typography variant="body2" sx={{ mr: 2, color: 'text.secondary' }}>
                              {timeStr}
                            </Typography>
                          )}
                          <Typography variant="body1">
                            {todo.title}
                          </Typography>
                        </Box>
                      }
                      secondary={todo.description}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              );
            })}
          </List>
        </Box>
      ))}
    </Box>
  );
};

export default TodoList;
