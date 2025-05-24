import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Divider, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useTodo } from '../contexts/TodoContext';
import { format, parseISO } from 'date-fns';
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

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Todoリスト
      </Typography>
      
      {/* タスクリスト選択 */}
      {taskLists && taskLists.length > 0 && (
        <FormControl fullWidth sx={{ mb: 3 }}>
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
      )}
      
      {/* タスク一覧 */}
      {todos.length === 0 ? (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="body1">
            タスクが見つかりません。
          </Typography>
        </Box>
      ) : (
        <List>
          {todos.map((todo) => (
            <React.Fragment key={todo.id}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">
                        {todo.title}
                      </Typography>
                      {todo.status === 'completed' && (
                        <Typography variant="body2" sx={{ ml: 2, color: 'success.main' }}>
                          完了
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      {todo.description && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {todo.description}
                        </Typography>
                      )}
                      {todo.startDate && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          期限: {formatDate(todo.startDate)}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
};

// 日付のフォーマット
const formatDate = (dateString) => {
  try {
    const date = parseISO(dateString);
    return format(date, 'yyyy年MM月dd日(E)', { locale: ja });
  } catch (e) {
    return dateString;
  }
};

export default TodoList;
