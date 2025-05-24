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
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        今後の予定
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
      
      {/* タスク一覧 */}
      {todos.length === 0 ? (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="body1">
            タスクが見つかりません。
          </Typography>
        </Box>
      ) : (
        sortedDates.map((date) => (
          <Box key={date} sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ bgcolor: 'primary.main', color: 'white', p: 1 }}>
              {date}
            </Typography>
            
            <List>
              {groupedTodos[date].map((todo) => (
                <React.Fragment key={todo.id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{
                            textDecoration: todo.status === 'completed' ? 'line-through' : 'none',
                          }}>
                            {todo.title}
                          </Typography>
                          {todo.status === 'completed' && (
                            <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                              (完了)
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={todo.description ? (
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {todo.description}
                        </Typography>
                      ) : null}
                    />
                  </ListItem>
                  <Divider />
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
