import React, { useState, useEffect } from 'react';
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
  DialogContentText,
  DialogActions,
  Button,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { format, parseISO, isValid, isToday, isBefore, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useTodo } from '../contexts/TodoContext';
import { useAuth } from '../contexts/AuthContext';

// フィルターリストの定義（Sidebarと同じ定義を持つ）
const filters = [
  { id: 'today', name: '今日', icon: '📅' },
  { id: 'tomorrow', name: '明日', icon: '📆' },
  { id: 'after-tomorrow', name: '今週', icon: '📆' },
  { id: 'past', name: '期限切れ', icon: '⏱️' },
  { id: 'starred', name: 'スター付き', icon: '⭐' },
  { id: 'all', name: 'すべて', icon: '📋' },
];

// カテゴリ別の色を定義（単一色に変更）
const categoryColors = {
  'default': '#1976d2'
};

const TodoList = () => {
  const { 
    todos, 
    taskLists, 
    selectedTaskList, 
    selectedFilter,
    showCompleted,
    loading, 
    error,
    toggleShowCompleted,
    createTask,
    moveTaskToList,
    deleteTask,
    toggleTaskCompletion,
    updateTask,
    reorderTasks,
    deleteTaskList
  } = useTodo();
  
  const { user } = useAuth();
  
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  
  // 削除確認ダイアログの状態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // 状態の追加
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false); // 編集モードかどうかを管理
  const [taskDetails, setTaskDetails] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'normal',
    categoryId: '',
    taskId: null // 編集時に使用するタスクID
  });
  
  // 設定ダイアログの状態
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // 選択されているタスクリストの情報を取得
  const selectedListInfo = taskLists?.find(list => list.id === selectedTaskList) || { title: 'すべてのタスク' };

  // 選択されているフィルターの情報を取得
  const selectedFilterInfo = filters.find(filter => filter.id === selectedFilter);

  // タスクリストのタイトルを取得する関数
  const getListTitle = () => {
    if (selectedFilter !== 'all') {
      return selectedFilterInfo?.name || 'すべてのタスク';
    } else if (!selectedTaskList) {
      return 'すべてのタスク';
    } else {
      return selectedListInfo.title;
    }
  };

  // タスクのマイリスト名を取得する関数
  const getTaskListName = (task) => {
    if (!task || !task.listId) return '';
    const list = taskLists.find(list => list.id === task.listId);
    return list ? list.title : '';
  };

  // テーマカラーを取得する関数
  const getThemeColor = (type) => {
    // CSSカスタムプロパティを使用
    switch (type) {
      case 'primary':
        return 'var(--primary-color)';
      case 'secondary':
        return 'var(--secondary-color)';
      case 'accent':
        return 'var(--accent-color)';
      case 'background':
        return 'var(--background-color)';
      case 'text':
        return 'var(--text-color)';
      case 'border':
        return 'var(--border-color)';
      default:
        return 'var(--primary-color)';
    }
  };
  
  // タスクの期限に基づいて背景色を取得する関数
  const getTaskBackgroundColor = (task) => {
    if (!task.startDate) return 'var(--task-normal-color)'; // 期限なし
    
    try {
      const date = parseISO(task.startDate);
      const today = new Date();
      
      // 期限切れ: 薄い赤色
      if (isBefore(date, startOfDay(today))) {
        return 'var(--task-overdue-color)';
      }
      // 今日中: 薄いオレンジ色
      else if (isToday(date)) {
        return 'var(--task-today-color)';
      }
      // それ以外: 白色
      else {
        return 'var(--task-normal-color)';
      }
    } catch (e) {
      return 'var(--task-normal-color)';
    }
  };

  // 削除確認ダイアログを開く
  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
    setMenuAnchorEl(null); // メニューを閉じる
  };
  
  // 設定ダイアログを開く
  const handleOpenSettingsDialog = () => {
    setSettingsDialogOpen(true);
    setMenuAnchorEl(null); // メニューを閉じる
  };

  // 削除確認ダイアログを閉じる
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  // タスクリストを削除する
  const handleDeleteTaskList = async () => {
    try {
      await deleteTaskList(selectedTaskList);
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Failed to delete task list:', err);
    }
  };

  // メニューを開く
  const handleMenuOpen = (event, task) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  // メニューを閉じる
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedTask(null);
  };

  // カテゴリ変更
  const handleCategoryChange = (listId) => {
    if (selectedTask && listId) {
      // タスクを別のリストに移動する処理
      moveTaskToList(selectedTask.id, listId);
    }
    handleMenuClose();
  };

  // タスクの順序変更
  const moveTask = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    const updatedTasks = [...todos];
    const [movedTask] = updatedTasks.splice(fromIndex, 1);
    updatedTasks.splice(toIndex, 0, movedTask);
    
    // コンテキストの関数を呼び出して並び替えを保存
    // メモリ内で並び替えを行い、同期キューに追加
    reorderTasks(updatedTasks);
  };

  // 並び順の状態
  const [sortOrder, setSortOrder] = useState('custom'); // 'custom' または 'dueDate'
  
  // ドラッグ終了時の処理（react-beautiful-dnd用）
  const handleDragEndRbd = (result) => {
    // ドロップ先がない場合や同じ位置の場合は何もしない
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    // タスクの並び替え
    moveTask(result.source.index, result.destination.index);
  };
  
  // 検索フィールドの状態
  const [searchQuery, setSearchQuery] = useState('');

  // 検索フィールドの変更を処理
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // タスクの編集を開始
  const handleEditTask = (task) => {
    // タスクの日付をYYYY-MM-DD形式に変換
    let formattedDate = '';
    if (task.startDate) {
      try {
        const date = parseISO(task.startDate);
        if (isValid(date)) {
          formattedDate = format(date, 'yyyy-MM-dd');
        }
      } catch (e) {
        console.error('日付の変換に失敗しました:', e);
      }
    }

    // タスクの詳細をダイアログにセット
    setTaskDetails({
      taskId: task.id,
      title: task.title,
      description: task.description || '',
      dueDate: formattedDate,
      priority: task.starred ? 'starred' : 'normal',
      categoryId: task.listId || ''
    });
    
    // 編集モードをオンにしてダイアログを開く
    setEditMode(true);
    setOpenDialog(true);
  };

  // タスクの保存（新規作成または更新）
  const handleSaveTask = async () => {
    if (!taskDetails.title.trim()) return;

    try {
      // スター状態をログ出力
      console.log(`Saving task with priority: ${taskDetails.priority}, starred: ${taskDetails.priority === 'starred'}`);
      
      const taskData = {
        title: taskDetails.title.trim(),
        notes: taskDetails.description || '',
        // Google Tasks APIが受け付ける形式に変換
        due: taskDetails.dueDate ? new Date(taskDetails.dueDate).toISOString() : null,
        // priorityの代わりにstarredを使用
        starred: taskDetails.priority === 'starred',
        // 明示的に優先度も設定
        priority: taskDetails.priority === 'starred' ? 'high' : 'normal'
      };

      console.log('Task data to be saved:', taskData);

      if (editMode) {
        // 既存タスクの更新
        console.log(`Updating task ${taskDetails.taskId} with data:`, taskData);
        await updateTask(taskDetails.taskId, taskData);
      } else {
        // 新規タスクの作成
        // taskDetails.categoryIdが設定されている場合はそれを使用、そうでなければselectedTaskListを使用
        const listId = taskDetails.categoryId || selectedTaskList;
        console.log(`Creating new task in list ${listId} with data:`, taskData);
        await createTask(taskData, listId);
      }
      
      handleCloseDialog();
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setOpenDialog(false);
    
    // フォームをリセット
    setTaskDetails({
      taskId: null,
      title: '',
      description: '',
      dueDate: '',
      priority: 'normal',
      categoryId: ''
    });
  };

  // タスク詳細の入力を処理
  const handleTaskDetailChange = (field) => (e) => {
    setTaskDetails({
      ...taskDetails,
      [field]: e.target.value
    });
  };
  
  // タスクを削除する処理
  const handleDeleteTask = async (taskId) => {
    try {
      // 既に取得済みのuseTodoコンテキストから削除メソッドを呼び出す
      await deleteTask(taskId);
    } catch (err) {
      console.error('タスクの削除に失敗しました:', err);
    }
  };

  // 新規タスクを作成する処理
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    try {
      const taskData = {
        title: newTaskTitle.trim(),
        notes: '',
        due: null,
        starred: false
      };
      
      await createTask(taskData, selectedTaskList);
      setNewTaskTitle('');
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  // ドラッグオーバー時の処理
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // ドロップ時の処理
  const handleDrop = (e, toIndex) => {
    const fromIndex = e.dataTransfer.getData('text/plain');
    moveTask(parseInt(fromIndex), toIndex);
  };

  // ドラッグ開始時の処理
  const handleDragStart = (e, index, taskId) => {
    e.dataTransfer.setData('text/plain', index);
    e.dataTransfer.setData('taskId', taskId);
    
    // ドラッグ中のタスクのスタイルを設定
    e.currentTarget.style.opacity = '0.6';
  };

  // ドラッグ終了時の処理
  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        pl: 2,
        pt: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '1.8rem' }}>
            {/* フィルターが選択されている場合はフィルター名、そうでなければリスト名を表示 */}
            {getListTitle()}
          </Typography>
          
          {/* マイリスト削除ボタン - マイリストが選択されている場合のみ表示 */}
          {selectedTaskList && selectedTaskList !== 'all' && selectedTaskList !== 'today' && selectedTaskList !== 'tomorrow' && selectedTaskList !== 'after-tomorrow' && selectedTaskList !== 'past' && (
            <IconButton
              size="small"
              onClick={handleOpenDeleteDialog}
              sx={{ 
                color: 'text.secondary',
                ml: 0.5,
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
              }}
              title="マイリストを削除"
            >
              <Box component="span" sx={{ fontSize: '1.2rem', display: 'block' }} className="emoji-icon">🗑️</Box>
            </IconButton>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* 完了タスク表示切替 */}
          <Typography 
            variant="body2" 
            component="label" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              userSelect: 'none',
              mr: 1
            }}
          >
            <Checkbox 
              checked={showCompleted} 
              onChange={toggleShowCompleted}
              size="small"
            />
            完了タスクを表示
          </Typography>
          
          {/* 設定ボタン（歯車アイコン） */}
          <IconButton
            size="small"
            onClick={handleOpenSettingsDialog}
            sx={{ 
              color: 'text.secondary',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
              mr: 0.5
            }}
            title="設定"
          >
            <Box component="span" sx={{ fontSize: '1.2rem', display: 'block' }} className="emoji-icon">⚙️</Box>
          </IconButton>
          
          {/* ユーザーメニュー */}
          {user && (
            <IconButton
              size="small"
              sx={{ ml: 1 }}
              onClick={(e) => setUserMenuAnchorEl(e.currentTarget)}
            >
              {user.picture ? (
                <Avatar 
                  src={user.picture} 
                  alt={user.name}
                  sx={{ width: 32, height: 32 }}
                />
              ) : (
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
              )}
            </IconButton>
          )}
        </Box>
      </Box>
      
      {/* 新規タスク入力フィールド */}
      <Box sx={{ 
        display: 'flex', 
        mb: 3,
        px: 2
      }}>
        <TextField
          fullWidth
          placeholder="新しいタスクを追加..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newTaskTitle.trim()) {
              handleCreateTask();
            }
          }}
          InputProps={{
            startAdornment: (
              <Box component="span" sx={{ mr: 1, color: 'text.secondary', fontSize: '1.2rem' }}>
                ➕
              </Box>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: '#f9fafb',
            }
          }}
        />
        <Button
          variant="contained"
          onClick={handleCreateTask}
          disabled={!newTaskTitle.trim()}
          sx={{ 
            ml: 1, 
            borderRadius: 2,
            minWidth: '80px'
          }}
        >
          追加
        </Button>
      </Box>
      
      {/* タスクリスト */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2, pb: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
        ) : todos.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            my: 8,
            color: 'text.secondary'
          }}>
            <Box component="span" sx={{ fontSize: '3rem', mb: 2 }}>📝</Box>
            <Typography variant="h6">タスクがありません</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              新しいタスクを追加してみましょう
            </Typography>
          </Box>
        ) : (
          <Box sx={{ 
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
          }}>
            <List sx={{ p: 0 }}>
              {todos.map((task, index) => (
                <React.Fragment key={task.id}>
                  <ListItem 
                    draggable
                    onDragStart={(e) => handleDragStart(e, index, task.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onDoubleClick={() => handleEditTask(task)}
                    sx={{ 
                      py: 1.5,
                      px: 2,
                      bgcolor: getTaskBackgroundColor(task),
                      borderLeft: `4px solid ${getThemeColor('primary')}`,
                      '&:hover': { 
                        bgcolor: getThemeColor('background'),
                        cursor: 'grab'
                      },
                      '&:active': {
                        cursor: 'grabbing'
                      }
                    }}
                  >
                    <Checkbox 
                      checked={task.status === 'completed'} 
                      onChange={() => toggleTaskCompletion(task.id, task.status)}
                      sx={{ 
                        mr: 1,
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        '&.Mui-checked': {
                          color: getThemeColor('primary'),
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
                          <span className="emoji-icon" style={{ marginRight: '4px' }}>📅</span>
                          {task.startDate ? format(parseISO(task.startDate), 'yyyy年MM月dd日', { locale: ja }) : '期限なし'}
                        </Box>
                        {task.starred && (
                          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                            <span className="emoji-icon" style={{ marginRight: '4px' }}>⭐</span>
                            スター付き
                          </Box>
                        )}
                        {/* マイリスト名を表示 */}
                        {task.listId && (
                          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                            <span className="emoji-icon" style={{ marginRight: '4px' }}>📁</span>
                            {getTaskListName(task)}
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton 
                        size="small" 
                        sx={{ 
                          color: 'text.secondary',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                        }}
                        onClick={() => handleEditTask(task)}
                      >
                        <Box 
                          component="span" 
                          sx={{ 
                            fontSize: '1rem',
                            display: 'inline-block'
                          }}
                          className="emoji-icon"
                        >
                          ✏️
                        </Box>
                      </IconButton>
                      <IconButton 
                        size="small" 
                        sx={{ 
                          color: 'text.secondary',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                        }}
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Box 
                          component="span" 
                          sx={{ 
                            fontSize: '1rem',
                            display: 'inline-block'
                          }}
                          className="emoji-icon"
                        >
                          🗑️
                        </Box>
                      </IconButton>
                    </Box>
                  </ListItem>
                  {index < todos.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}
      </Box>

      {/* マイリスト変更メニュー */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        sx={{
          maxHeight: '300px', // メニューの最大高さを設定
        }}
      >
        {taskLists && taskLists.map((list) => (
          <MenuItem 
            key={list.id} 
            onClick={() => handleCategoryChange(list.id)}
            sx={{
              color: list.id === selectedTask?.listId ? 'primary.main' : 'inherit',
              fontWeight: list.id === selectedTask?.listId ? 500 : 400,
            }}
          >
            {list.title}
          </MenuItem>
        ))}
      </Menu>
      
      {/* ユーザーメニュー */}
      <Menu
        anchorEl={userMenuAnchorEl}
        open={Boolean(userMenuAnchorEl)}
        onClose={() => setUserMenuAnchorEl(null)}
      >
        {user && (
          <MenuItem disabled sx={{ opacity: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle2">{user.name}</Typography>
              <Typography variant="caption" color="text.secondary">{user.email}</Typography>
            </Box>
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          setUserMenuAnchorEl(null);
          // ログアウト処理
          if (typeof signOut === 'function') signOut();
        }}>
          <Box component="span" sx={{ fontSize: '1.2rem', mr: 1 }}>🚪</Box>
          ログアウト
        </MenuItem>
      </Menu>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          リストの削除
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            「{selectedListInfo.title}」リストを削除しますか？このリスト内のすべてのタスクも削除されます。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>キャンセル</Button>
          <Button onClick={handleDeleteTaskList} color="error" autoFocus>
            削除する
          </Button>
        </DialogActions>
      </Dialog>

      {/* 新規タスク作成ダイアログ */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editMode ? 'タスクの編集' : '新規タスクの作成'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="タイトル"
              fullWidth
              value={taskDetails.title}
              onChange={handleTaskDetailChange('title')}
              required
              autoFocus
            />
            
            <TextField
              label="内容"
              fullWidth
              multiline
              rows={4}
              value={taskDetails.description}
              onChange={handleTaskDetailChange('description')}
            />
            
            <TextField
              label="期限"
              type="date"
              fullWidth
              value={taskDetails.dueDate}
              onChange={handleTaskDetailChange('dueDate')}
              InputLabelProps={{
                shrink: true,
              }}
            />
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>優先度</Typography>
              <RadioGroup
                row
                value={taskDetails.priority}
                onChange={handleTaskDetailChange('priority')}
              >
                <FormControlLabel value="normal" control={<Radio sx={{ '&.Mui-checked': { color: getThemeColor('primary') } }} />} label="通常" />
                <FormControlLabel value="starred" control={<Radio sx={{ '&.Mui-checked': { color: getThemeColor('primary') } }} />} label="スター付き" />
              </RadioGroup>
            </Box>
            
            {taskLists && taskLists.length > 0 && (
              <FormControl fullWidth>
                <InputLabel>マイリスト</InputLabel>
                <Select
                  value={taskDetails.categoryId || selectedTaskList}
                  onChange={handleTaskDetailChange('categoryId')}
                  label="マイリスト"
                >
                  {taskLists.map((list) => (
                    <MenuItem key={list.id} value={list.id}>
                      {list.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button 
            onClick={handleSaveTask} 
            variant="contained" 
            sx={{ 
              bgcolor: getThemeColor('primary'),
              '&:hover': {
                bgcolor: getThemeColor('secondary')
              }
            }}
            disabled={!taskDetails.title}
          >
            {editMode ? '更新' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TodoList;
