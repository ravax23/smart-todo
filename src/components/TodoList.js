import React from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  CircularProgress, 
  Alert, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Checkbox
} from '@mui/material';
import { useTodo } from '../contexts/TodoContext';
import { format, parseISO, isValid } from 'date-fns';
import { ja } from 'date-fns/locale';

const TodoList = () => {
  const { todos, taskLists, selectedTaskList, loading, error, selectTaskList } = useTodo();

  const handleTaskListChange = (event) => {
    selectTaskList(event.target.value);
  };

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

  // タスクを日付でグループ化
  const groupedTodos = todos.reduce((acc, todo) => {
    let dateStr = '期限なし';
    
    if (todo.startDate) {
      try {
        const date = parseISO(todo.startDate);
        if (isValid(date)) {
          dateStr = format(date, 'yyyy年MM月dd日(E)', { locale: ja });
        }
      } catch (e) {
        console.error('Date parsing error:', e);
      }
    }
    
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    
    acc[dateStr].push(todo);
    return acc;
  }, {});

  // 日付でソート
  const sortedDates = Object.keys(groupedTodos).sort((a, b) => {
    if (a === '期限なし') return 1;
    if (b === '期限なし') return -1;
    
    try {
      // "yyyy年MM月dd日(E)" 形式から日付を抽出
      const dateA = a.match(/(\d{4})年(\d{2})月(\d{2})日/);
      const dateB = b.match(/(\d{4})年(\d{2})月(\d{2})日/);
      
      if (dateA && dateB) {
        const [_, yearA, monthA, dayA] = dateA;
        const [__, yearB, monthB, dayB] = dateB;
        
        return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
      }
    } catch (e) {
      console.error('Date sorting error:', e);
    }
    
    return a.localeCompare(b);
  });

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Todo App
      </Typography>
      
      {/* タスクリスト選択 */}
      {taskLists && taskLists.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel id="task-list-select-label">タスクリスト</InputLabel>
            <Select
              labelId="task-list-select-label"
              id="task-list-select"
              value={selectedTaskList}
              label="タスクリスト"
              onChange={handleTaskListChange}
            >
              {taskLists.map((list) => (
                <MenuItem key={list.id} value={list.id}>{list.title}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}
      
      {/* カテゴリタブ */}
      <Box sx={{ display: 'flex', mb: 2 }}>
        <Box sx={{ 
          py: 1, 
          px: 2, 
          bgcolor: 'primary.main', 
          color: 'white',
          borderRadius: '4px 4px 0 0'
        }}>
          すべて
        </Box>
        <Box sx={{ 
          py: 1, 
          px: 2, 
          ml: 1,
          color: 'text.secondary',
          borderBottom: '1px solid #e0e0e0'
        }}>
          仕事
        </Box>
        <Box sx={{ 
          py: 1, 
          px: 2, 
          ml: 1,
          color: 'text.secondary',
          borderBottom: '1px solid #e0e0e0'
        }}>
          個人
        </Box>
      </Box>
      
      {/* タスク一覧 */}
      {todos.length === 0 ? (
        <Box sx={{ textAlign: 'center', my: 4, p: 3, border: '1px solid #e0e0e0' }}>
          <Typography variant="body1">
            タスクが見つかりません。
          </Typography>
        </Box>
      ) : (
        sortedDates.map((date) => (
          <Box key={date} sx={{ mb: 4 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                bgcolor: '#1976d2', 
                color: 'white', 
                p: 1.5,
                borderRadius: '4px 4px 0 0'
              }}
            >
              {date}
            </Typography>
            
            <List sx={{ 
              border: '1px solid #e0e0e0', 
              borderTop: 'none',
              borderRadius: '0 0 4px 4px'
            }}>
              {groupedTodos[date].map((todo) => (
                <React.Fragment key={todo.id}>
                  <ListItem>
                    <Checkbox 
                      checked={todo.status === 'completed'} 
                      sx={{ mr: 1 }}
                    />
                    <ListItemText
                      primary={
                        <Typography 
                          variant="body1" 
                          sx={{
                            textDecoration: todo.status === 'completed' ? 'line-through' : 'none',
                            color: todo.status === 'completed' ? 'text.secondary' : 'text.primary'
                          }}
                        >
                          {todo.title}
                        </Typography>
                      }
                      secondary={todo.description ? (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mt: 0.5,
                            color: 'text.secondary',
                            textDecoration: todo.status === 'completed' ? 'line-through' : 'none'
                          }}
                        >
                          {todo.description}
                        </Typography>
                      ) : null}
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          </Box>
        ))
      )}
    </Box>
  );
};

export default TodoList;
