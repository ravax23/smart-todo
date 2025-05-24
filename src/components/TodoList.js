import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  Divider, 
  CircularProgress, 
  Alert,
  TextField,
  IconButton,
  Checkbox,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  FormHelperText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';
import { format, parseISO, isValid } from 'date-fns';
import { useTodo } from '../contexts/TodoContext';

// カテゴリ別の色を定義
const categoryColors = {
  'work-hisys': '#e74c3c',
  'work-internal': '#3498db',
  'personal': '#2ecc71'
};

const TodoList = () => {
  const { 
    todos, 
    taskLists, 
    selectedTaskList, 
    loading, 
    error,
    createTask
  } = useTodo();
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    notes: '',
    due: null,
    taskListId: selectedTaskList
  });
  const [dialogError, setDialogError] = useState('');

  // 選択されているタスクリストの情報を取得
  const selectedListInfo = React.useMemo(() => {
    if (taskLists && taskLists.length > 0 && selectedTaskList) {
      const list = taskLists.find(list => list.id === selectedTaskList);
      if (list) {
        // カテゴリを判定
        let category = 'personal';
        if (list.title.includes('HISYS')) {
          category = 'work-hisys';
        } else if (list.title.includes('社内')) {
          category = 'work-internal';
        }
        return { ...list, category };
      }
    }
    return { title: 'タスク', category: 'personal' };
  }, [taskLists, selectedTaskList]);

  // タスクのカテゴリに対応するリスト名を取得する関数
  const getTaskListName = (category) => {
    if (!taskLists || taskLists.length === 0) return '';
    
    let listName = '';
    
    // カテゴリに基づいてタスクリストを検索
    if (category === 'work-hisys') {
      const list = taskLists.find(list => list.title.includes('HISYS'));
      if (list) listName = list.title;
    } else if (category === 'work-internal') {
      const list = taskLists.find(list => list.title.includes('社内'));
      if (list) listName = list.title;
    } else if (category === 'personal') {
      const list = taskLists.find(list => !list.title.includes('HISYS') && !list.title.includes('社内'));
      if (list) listName = list.title;
    }
    
    return listName || '未分類';
  };

  // 新規タスク入力フィールドでEnterキーが押されたときの処理
  const handleNewTaskKeyPress = (e) => {
    if (e.key === 'Enter' && newTaskTitle.trim()) {
      setNewTaskData({
        title: newTaskTitle.trim(),
        notes: '',
        due: null,
        taskListId: selectedTaskList
      });
      setDialogOpen(true);
    }
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogError('');
  };

  // 新規タスクを作成
  const handleCreateTask = async () => {
    if (!newTaskData.title.trim()) {
      setDialogError('タイトルを入力してください');
      return;
    }

    try {
      const taskData = {
        title: newTaskData.title,
        notes: newTaskData.notes || '',
        due: newTaskData.due ? format(newTaskData.due, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : undefined
      };

      await createTask(taskData, newTaskData.taskListId);
      
      // 入力フィールドをクリア
      setNewTaskTitle('');
      setNewTaskData({
        title: '',
        notes: '',
        due: null,
        taskListId: selectedTaskList
      });
      
      // ダイアログを閉じる
      setDialogOpen(false);
      setDialogError('');
    } catch (err) {
      setDialogError(`タスクの作成に失敗しました: ${err.message}`);
    }
  };

  // ドラッグ開始時の処理
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
    
    // ドラッグ中のタスクのスタイルを設定
    e.currentTarget.style.opacity = '0.6';
  };

  // ドラッグ終了時の処理
  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
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
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {selectedListInfo.title}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', bgcolor: '#f9fafb', p: '8px 16px', borderRadius: 1 }}>
          {format(new Date(), 'yyyy年MM月dd日(E)', { locale: ja })}
        </Typography>
      </Box>

      {/* 新規タスク入力フィールド */}
      <Box sx={{ position: 'relative', mb: 3 }}>
        <TextField
          fullWidth
          placeholder="新しいタスクを追加"
          variant="outlined"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyPress={handleNewTaskKeyPress}
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
        <Box sx={{ 
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <List sx={{ p: 0 }}>
            {todos.map((task, index) => (
              <React.Fragment key={task.id}>
                <ListItem 
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                  sx={{ 
                    py: 1.5,
                    px: 2,
                    bgcolor: 'white',
                    borderLeft: `4px solid ${categoryColors[task.category]}`,
                    '&:hover': { 
                      bgcolor: '#f9fafb',
                      cursor: 'grab'
                    },
                    '&:active': {
                      cursor: 'grabbing'
                    }
                  }}
                >
                  <Checkbox 
                    checked={task.status === 'completed'} 
                    sx={{ 
                      mr: 1,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      '&.Mui-checked': {
                        color: categoryColors[task.category],
                      }
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="body1" 
                      sx={{
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                        color: task.status === 'completed' ? 'text.secondary' : 'text.primary',
                        mb: 0.5,
                        fontWeight: 500,
                        fontSize: '0.9375rem'
                      }}
                    >
                      {task.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: 'text.secondary' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '4px' }}>📅</span>
                        {task.startDate ? format(parseISO(task.startDate), 'MM月dd日', { locale: ja }) : '期限なし'}
                      </Box>
                      <Box 
                        sx={{ 
                          ml: 2, 
                          bgcolor: categoryColors[task.category],
                          color: 'white',
                          px: 1,
                          py: 0.25,
                          borderRadius: '1rem',
                          fontSize: '0.6875rem'
                        }}
                      >
                        {getTaskListName(task.category)}
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
                      🗑️
                    </IconButton>
                  </Box>
                </ListItem>
                {index < todos.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}

      {/* 新規タスク作成ダイアログ */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>新しいタスクを作成</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="タイトル"
              fullWidth
              value={newTaskData.title}
              onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
              error={dialogError.includes('タイトル')}
              helperText={dialogError.includes('タイトル') ? dialogError : ''}
            />
            
            <TextField
              label="メモ"
              fullWidth
              multiline
              rows={3}
              value={newTaskData.notes}
              onChange={(e) => setNewTaskData({ ...newTaskData, notes: e.target.value })}
            />
            
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
              <DatePicker
                label="期限"
                value={newTaskData.due}
                onChange={(date) => setNewTaskData({ ...newTaskData, due: date })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
            
            <FormControl fullWidth>
              <InputLabel id="task-list-select-label">リスト</InputLabel>
              <Select
                labelId="task-list-select-label"
                value={newTaskData.taskListId}
                label="リスト"
                onChange={(e) => setNewTaskData({ ...newTaskData, taskListId: e.target.value })}
              >
                {taskLists.map((list) => (
                  <MenuItem key={list.id} value={list.id}>{list.title}</MenuItem>
                ))}
              </Select>
              <FormHelperText>タスクを追加するリストを選択してください</FormHelperText>
            </FormControl>
            
            {dialogError && !dialogError.includes('タイトル') && (
              <Alert severity="error">{dialogError}</Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleCreateTask} variant="contained" color="primary">
            作成
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TodoList;
