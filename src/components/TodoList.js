import React from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  Divider, 
  CircularProgress, 
  Alert, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  TextField,
  IconButton,
  Checkbox
} from '@mui/material';
import { useTodo } from '../contexts/TodoContext';
import { format, parseISO, isValid } from 'date-fns';
import { ja } from 'date-fns/locale';

// カテゴリ別の色を定義
const categoryColors = {
  'work-hisys': '#e74c3c',
  'work-internal': '#3498db',
  'personal': '#2ecc71'
};

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

  // タスクのカテゴリを判定する関数
  const getTaskCategory = (task) => {
    // ここでは仮のロジックとして、タスクのタイトルに基づいてカテゴリを判定
    // 実際のアプリでは、タスクのカテゴリ情報に基づいて判定する
    if (task.title.includes('HISYS') || task.title.includes('クライアント')) {
      return 'work-hisys';
    } else if (task.title.includes('社内') || task.title.includes('仕様書')) {
      return 'work-internal';
    } else {
      return 'personal';
    }
  };

  // カテゴリ名を表示用に変換する関数
  const getCategoryLabel = (category) => {
    switch (category) {
      case 'work-hisys':
        return 'HISYS';
      case 'work-internal':
        return '社内';
      case 'personal':
        return '個人';
      default:
        return '';
    }
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <Box 
            component="span" 
            sx={{ 
              width: 12, 
              height: 12, 
              borderRadius: '50%', 
              backgroundColor: categoryColors['work-hisys'],
              display: 'inline-block',
              mr: 1.5
            }} 
          />
          仕事（HISYS）
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', bgcolor: '#f9fafb', p: '8px 16px', borderRadius: 1 }}>
          {format(new Date(), 'yyyy年MM月dd日(E)', { locale: ja })}
        </Typography>
      </Box>

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

      {/* 新規タスク入力フィールド */}
      <Box sx={{ position: 'relative', mb: 3 }}>
        <TextField
          fullWidth
          placeholder="新しいタスクを追加"
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              pl: 4,
              bgcolor: '#f9fafb',
            }
          }}
        />
        <Box sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'text.secondary', fontSize: '1.5rem' }}>
          +
        </Box>
      </Box>
      
      {/* タスク一覧 */}
      {todos.length === 0 ? (
        <Box sx={{ textAlign: 'center', my: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <Typography variant="body1" color="text.secondary">
            タスクが見つかりません。
          </Typography>
        </Box>
      ) : (
        sortedDates.map((date) => (
          <Box key={date} sx={{ mb: 3 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                bgcolor: '#2c3e50', 
                color: 'white', 
                p: 1.5,
                borderRadius: '4px 4px 0 0',
                fontWeight: 500
              }}
            >
              {date}
            </Typography>
            
            <List sx={{ 
              p: 0,
              border: '1px solid #e0e0e0',
              borderTop: 'none',
              borderRadius: '0 0 4px 4px',
              overflow: 'hidden'
            }}>
              {groupedTodos[date].map((todo, index) => {
                const category = getTaskCategory(todo);
                return (
                  <React.Fragment key={todo.id}>
                    <ListItem 
                      sx={{ 
                        py: 1.5,
                        px: 2,
                        bgcolor: '#ffffff',
                        borderLeft: `4px solid ${categoryColors[category]}`,
                        '&:hover': { 
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          transform: 'translateY(-2px)',
                          transition: 'all 0.2s'
                        }
                      }}
                    >
                      <Checkbox 
                        checked={todo.status === 'completed'} 
                        sx={{ 
                          mr: 1,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          '&.Mui-checked': {
                            color: categoryColors[category],
                          }
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="body1" 
                          sx={{
                            textDecoration: todo.status === 'completed' ? 'line-through' : 'none',
                            color: todo.status === 'completed' ? 'text.secondary' : 'text.primary',
                            mb: 0.5,
                            fontWeight: 500,
                            fontSize: '0.9375rem'
                          }}
                        >
                          {todo.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: 'text.secondary' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '4px' }}>📅</span>
                            {todo.startDate ? format(parseISO(todo.startDate), 'MM月dd日', { locale: ja }) : '期限なし'}
                          </Box>
                          <Box 
                            sx={{ 
                              ml: 2, 
                              bgcolor: `rgba(${category === 'work-hisys' ? '231, 76, 60' : category === 'work-internal' ? '52, 152, 219' : '46, 204, 113'}, 0.1)`,
                              color: categoryColors[category],
                              px: 1,
                              py: 0.25,
                              borderRadius: '1rem',
                              fontSize: '0.6875rem'
                            }}
                          >
                            {getCategoryLabel(category)}
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ 
                        display: 'flex', 
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        '.MuiListItem-root:hover &': {
                          opacity: 1
                        }
                      }}>
                        <IconButton size="small" sx={{ color: 'text.secondary' }}>
                          ✏️
                        </IconButton>
                        <IconButton size="small" sx={{ color: 'text.secondary' }}>
                          🗑️
                        </IconButton>
                      </Box>
                    </ListItem>
                    {index < groupedTodos[date].length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </Box>
        ))
      )}
    </Box>
  );
};

export default TodoList;
