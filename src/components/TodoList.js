import React from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Divider, 
  CircularProgress, 
  Alert, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Paper,
  Checkbox,
  IconButton
} from '@mui/material';
import { useTodo } from '../contexts/TodoContext';
import { format, parseISO, isValid } from 'date-fns';
import { ja } from 'date-fns/locale';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

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
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'medium', color: 'text.primary' }}>
        Todoリスト
      </Typography>
      
      {/* タスクリスト選択 */}
      {taskLists && taskLists.length > 0 && (
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.paper', border: '1px solid #e0e0e0' }}>
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
        </Paper>
      )}
      
      {/* タスク一覧 */}
      {todos.length === 0 ? (
        <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper', border: '1px solid #e0e0e0' }}>
          <Typography variant="body1" color="text.secondary">
            タスクが見つかりません。
          </Typography>
        </Paper>
      ) : (
        sortedDates.map((date) => (
          <Paper 
            key={date} 
            elevation={0} 
            sx={{ 
              mb: 3, 
              overflow: 'hidden',
              bgcolor: 'background.paper',
              border: '1px solid #e0e0e0',
              borderRadius: 1
            }}
          >
            <Box sx={{ 
              bgcolor: 'grey.100', 
              p: 1.5,
              borderBottom: '1px solid #e0e0e0'
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                {date}
              </Typography>
            </Box>
            
            <List disablePadding>
              {groupedTodos[date].map((todo) => (
                <React.Fragment key={todo.id}>
                  <ListItem 
                    sx={{ 
                      py: 1.5,
                      px: 2,
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Checkbox
                        edge="start"
                        checked={todo.status === 'completed'}
                        icon={<RadioButtonUncheckedIcon />}
                        checkedIcon={<CheckCircleOutlineIcon />}
                        sx={{ 
                          color: 'text.secondary',
                          '&.Mui-checked': { color: 'text.secondary' }
                        }}
                      />
                    </ListItemIcon>
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
          </Paper>
        ))
      )}
    </Box>
  );
};

export default TodoList;
