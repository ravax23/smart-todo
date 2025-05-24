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
  Checkbox,
  Paper
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
    <Box>
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
      
      {/* タスク一覧 */}
      {todos.length === 0 ? (
        <Paper elevation={0} sx={{ p: 3, textAlign: 'center', border: '1px solid #e0e0e0' }}>
          <Typography variant="body1">
            タスクが見つかりません。
          </Typography>
        </Paper>
      ) : (
        sortedDates.map((date) => (
          <Box key={date} sx={{ mb: 3 }}>
            <Paper 
              elevation={0} 
              sx={{ 
                bgcolor: '#2196f3', 
                color: 'white',
                borderRadius: '4px 4px 0 0',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ p: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  {date}
                </Typography>
              </Box>
            </Paper>
            
            <Paper 
              elevation={0} 
              sx={{ 
                border: '1px solid #e0e0e0',
                borderTop: 'none',
                borderRadius: '0 0 4px 4px',
                overflow: 'hidden'
              }}
            >
              <List disablePadding>
                {groupedTodos[date].map((todo, index) => (
                  <React.Fragment key={todo.id}>
                    <ListItem 
                      sx={{ 
                        py: 1.5,
                        bgcolor: index % 2 === 0 ? 'background.paper' : '#f5f5f5'
                      }}
                    >
                      <Checkbox 
                        checked={todo.status === 'completed'} 
                        sx={{ mr: 1 }}
                        disableRipple
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
                    {index < groupedTodos[date].length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Box>
        ))
      )}
    </Box>
  );
};

export default TodoList;
