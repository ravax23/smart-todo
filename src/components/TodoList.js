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
  Select,
  InputAdornment
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { format, parseISO, isValid, isToday, isBefore, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useTodo } from '../contexts/TodoContext';
import UserMenu from './UserMenu';
import SettingsDialog from './SettingsDialog';

// フィルターリストの定義（Sidebarと同じ定義を持つ）
const filters = [
  { id: 'today', name: '今日', icon: '📅' },
  { id: 'after-tomorrow', name: '今週', icon: '📆' },
  { id: 'past', name: '期限切れ', icon: '⏱️' },
  { id: 'starred', name: 'スター付き', icon: '⭐' },
  { id: 'all', name: 'すべて', icon: '📋' },
];

// カテゴリ別の色を定義（単一色に変更）
const categoryColors = {
  'default': '#1976d2'
};

const TodoList = ({ isMobile }) => {
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
  
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // 削除確認ダイアログの状態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTaskDialogOpen, setDeleteTaskDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  
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
    if (selectedFilter && selectedFilter !== 'all') {
      // フィルター選択時はフィルター名を表示
      return selectedFilterInfo?.name || 'すべて';
    } else if (selectedFilter === 'all') {
      // 「すべて」フィルター選択時は「すべて」を表示
      return 'すべて';
    } else if (!selectedTaskList) {
      // タスクリスト未選択時は「すべて」を表示
      return 'すべて';
    } else {
      // マイリスト選択時はマイリスト名を表示
      return selectedListInfo.title;
    }
  };

  // タスクのマイリスト名を取得する関数
  const getTaskListName = (task) => {
    if (!task || !task.listId) return '';
    const list = taskLists.find(list => list.id === task.listId);
    return list ? list.title : '';
  };

  // それ以外の場合はリストIDを表示（デバッグ用）
  const getListId = (task) => {
    return `リスト: ${task.listId.substring(0, 8)}...`;
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
      description: task.notes || '', // notesプロパティを使用
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
      const isStarred = taskDetails.priority === 'starred';
      console.log(`Saving task with priority: ${taskDetails.priority}, starred: ${isStarred}`);
      
      // 期限の処理
      let dueDate = null;
      if (taskDetails.dueDate) {
        try {
          // 日付文字列をDateオブジェクトに変換
          const dateObj = new Date(taskDetails.dueDate);
          // 時間を23:59:59に設定して、その日の終わりを表す
          dateObj.setHours(23, 59, 59, 999);
          // ISO文字列に変換
          dueDate = dateObj.toISOString();
          console.log(`Setting due date to: ${dueDate} from input: ${taskDetails.dueDate}`);
        } catch (dateError) {
          console.error('Error formatting date:', dateError);
          // エラーが発生した場合は元の文字列をそのまま使用
          dueDate = taskDetails.dueDate;
        }
      } else {
        console.log('No due date provided, setting to null');
      }
      
      const taskData = {
        title: taskDetails.title.trim(),
        notes: taskDetails.description || '',
        // Google Tasks APIが受け付ける形式に変換
        due: dueDate,
        // スター状態を明示的に設定
        starred: isStarred
      };

      console.log('Task data to be saved:', JSON.stringify(taskData, null, 2));

      if (editMode) {
        // 既存タスクの更新
        console.log(`Updating task ${taskDetails.taskId} with data:`, JSON.stringify(taskData, null, 2));
        
        // 現在のタスクを取得
        const currentTask = todos.find(task => task.id === taskDetails.taskId);
        console.log('Current task before update:', currentTask);
        
        // マイリストが変更されたかチェック
        if (currentTask && taskDetails.categoryId && currentTask.listId !== taskDetails.categoryId) {
          // マイリストが変更された場合は、moveTaskToListを使用
          console.log(`Moving task from list ${currentTask.listId} to ${taskDetails.categoryId}`);
          await moveTaskToList(taskDetails.taskId, taskDetails.categoryId);
        }
        
        // タスクの他の情報を更新
        await updateTask(taskDetails.taskId, taskData);
      } else {
        // 新規タスクの作成
        // taskDetails.categoryIdが設定されている場合はそれを使用、そうでなければselectedTaskListを使用
        const listId = taskDetails.categoryId || selectedTaskList;
        console.log(`Creating new task in list ${listId} with data:`, JSON.stringify(taskData, null, 2));
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
    // 削除するタスクをセットして確認ダイアログを表示
    setTaskToDelete(taskId);
    setDeleteTaskDialogOpen(true);
  };

  // タスク削除の確認
  const confirmDeleteTask = async () => {
    try {
      if (taskToDelete) {
        // 既に取得済みのuseTodoコンテキストから削除メソッドを呼び出す
        await deleteTask(taskToDelete);
        // ダイアログを閉じてタスクIDをリセット
        setDeleteTaskDialogOpen(false);
        setTaskToDelete(null);
      }
    } catch (err) {
      console.error('タスクの削除に失敗しました:', err);
    }
  };

  // タスク削除のキャンセル
  const cancelDeleteTask = () => {
    setDeleteTaskDialogOpen(false);
    setTaskToDelete(null);
  };

  // リストの色を取得する関数（マイリストの色分けを行わない）
  const getListColor = () => {
    // 黒色に変更
    return '#333333'; // 黒色（少し柔らかい黒）
  };
  
  // テーマカラーを取得する関数
  const getThemeColor2 = (type) => {
    // テーマに応じた色を返す
    const colors = {
      primary: '#333333', // 黒色（少し柔らかい黒）
      secondary: '#555555', // グレー
      accent: '#777777', // アクセントカラー
      background: '#f9fafb', // 背景色
      text: '#333333', // テキスト色
      border: '#e0e0e0' // ボーダー色
    };
    
    return colors[type] || colors.primary;
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
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box 
        className={isMobile ? 'header-mobile' : ''}
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3, 
          pl: isMobile ? 0 : 2, 
          pt: isMobile ? 0 : 2,
          pr: isMobile ? 0 : 2
        }}
      >
        {isMobile ? (
          <>
            {/* モバイル用シンプルヘッダー */}
            <Typography 
              variant="h5" 
              sx={{ fontWeight: 600 }}
              className="header-title-mobile"
              noWrap
              title={getListTitle()} // ツールチップとして完全なタイトルを表示
            >
              {getListTitle()}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* 新規タスク追加ボタン */}
              <IconButton
                className="mobile-action-button"
                onClick={() => {
                  setTaskDetails({
                    ...taskDetails,
                    title: ''
                  });
                  setEditMode(false);
                  setOpenDialog(true);
                }}
                sx={{ 
                  color: 'primary.main',
                  mr: 1
                }}
              >
                <Box component="span" sx={{ fontSize: '1.5rem' }}>+</Box>
              </IconButton>
              
              {/* ユーザーメニュー */}
              <Box sx={{ ml: 'auto' }}>
                <UserMenu />
              </Box>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h5" 
                sx={{ fontWeight: 600 }}
                noWrap
                title={getListTitle()}
              >
                {/* フィルターが選択されている場合はフィルター名、そうでなければリスト名を表示 */}
                {getListTitle()}
              </Typography>
              
              {/* マイリスト削除ボタン - マイリストが選択されている場合のみ表示（フィルター表示時は非表示） */}
              {selectedTaskList && selectedTaskList !== 'all' && !filters.some(filter => filter.id === selectedTaskList) && !selectedFilter && (
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
              
              {/* ユーザーメニュー（右寄せ） */}
              <Box sx={{ ml: 'auto' }}>
                <UserMenu />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* 新規タスク追加ボタン */}
              <Box 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  border: '2px dashed #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  mr: 2,
                  '&:hover': {
                    borderColor: getThemeColor('primary'),
                    bgcolor: 'rgba(0,0,0,0.02)'
                  }
                }}
                onClick={() => {
                  setTaskDetails({
                    ...taskDetails,
                    title: ''
                  });
                  setEditMode(false);
                  setOpenDialog(true);
                }}
              >
                <Box component="span" sx={{ fontSize: '1.2rem', mr: 1, color: 'var(--primary-color)' }} className="emoji-icon">+</Box>
                <Typography variant="body2" sx={{ color: getThemeColor('primary'), fontWeight: 500 }}>
                  新しいタスクを追加
                </Typography>
              </Box>

              {/* 完了タスク表示切替 */}
              <Typography 
                variant="body2" 
                component="label" 
                className={isMobile ? 'completed-tasks-toggle-mobile' : ''}
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
              
              {/* ユーザーメニュー（Googleログインアイコン） */}
              <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                <UserMenu />
              </Box>
            </Box>
          </>
        )}
      </Box>
      
      {/* 設定ダイアログ */}
      <Dialog 
        open={settingsDialogOpen} 
        onClose={() => setSettingsDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>設定</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>表示設定</Typography>
            
            <FormControl component="fieldset" sx={{ mt: 2, display: 'block' }}>
              <Typography variant="subtitle2" gutterBottom>テーマ</Typography>
              <RadioGroup
                row
                value="light"
                onChange={() => {}}
              >
                <FormControlLabel value="light" control={<Radio />} label="ライト" />
                <FormControlLabel value="dark" control={<Radio />} label="ダーク" />
                <FormControlLabel value="system" control={<Radio />} label="システム設定に合わせる" />
              </RadioGroup>
            </FormControl>
            
            <FormControl fullWidth sx={{ mt: 3 }}>
              <InputLabel>日付表示形式</InputLabel>
              <Select
                value="yyyy-MM-dd"
                onChange={() => {}}
                label="日付表示形式"
              >
                <MenuItem value="yyyy-MM-dd">YYYY-MM-DD</MenuItem>
                <MenuItem value="MM/dd/yyyy">MM/DD/YYYY</MenuItem>
                <MenuItem value="dd/MM/yyyy">DD/MM/YYYY</MenuItem>
                <MenuItem value="yyyy年MM月dd日">YYYY年MM月DD日</MenuItem>
              </Select>
            </FormControl>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>通知設定</Typography>
            
            <FormControlLabel
              control={<Checkbox checked={true} onChange={() => {}} />}
              label="タスク期限の通知"
              sx={{ display: 'block', mt: 1 }}
            />
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>通知タイミング</InputLabel>
              <Select
                value="1day"
                onChange={() => {}}
                label="通知タイミング"
              >
                <MenuItem value="same">当日</MenuItem>
                <MenuItem value="1day">1日前</MenuItem>
                <MenuItem value="3days">3日前</MenuItem>
                <MenuItem value="1week">1週間前</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>キャンセル</Button>
          <Button 
            onClick={() => setSettingsDialogOpen(false)} 
            variant="contained"
            sx={{ 
              bgcolor: getThemeColor('primary'),
              '&:hover': {
                bgcolor: getThemeColor('secondary')
              }
            }}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 新規タスク作成ダイアログ */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        fullWidth 
        maxWidth="sm"
        fullScreen={isMobile}
      >
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
              value={taskDetails.dueDate || ''}
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
            color="primary"
            disabled={!taskDetails.title}
          >
            {editMode ? '更新' : '作成'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* タスク一覧 */}
      {error && (
        <Box sx={{ mb: 3, mx: 2 }}>
          <Alert 
            severity="error" 
            action={
              <Button 
                color="inherit" 
                size="small"
                onClick={() => {
                  // エラーメッセージに401や認証エラーが含まれている場合、ログイン画面にリダイレクト
                  if (error.includes('401') || error.includes('認証情報が無効') || error.includes('invalid authentication credentials')) {
                    // ローカルストレージとセッションストレージからトークンを削除
                    localStorage.removeItem('google_access_token');
                    localStorage.removeItem('google_auth_token');
                    localStorage.removeItem('google_user_info');
                    sessionStorage.removeItem('google_access_token');
                    sessionStorage.removeItem('google_auth_token');
                    sessionStorage.removeItem('google_user_info');
                    
                    // 認証状態変更イベントを発行
                    const authEvent = new CustomEvent('googleAuthStateChanged', { 
                      detail: { isAuthenticated: false } 
                    });
                    window.dispatchEvent(authEvent);
                    
                    // ページをリロード（ログイン画面に遷移）
                    window.location.reload();
                  } else {
                    // その他のエラーの場合は単に再読み込み
                    window.location.reload();
                  }
                }}
              >
                {error.includes('401') || error.includes('認証情報が無効') || error.includes('invalid authentication credentials') 
                  ? 'ログイン画面へ' 
                  : '再読み込み'
                }
              </Button>
            }
          >
            {error}
          </Alert>
        </Box>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : todos.length === 0 ? (
        <Box sx={{ textAlign: 'center', my: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 1, mx: 2 }}>
          <Typography variant="body1" color="text.secondary">
            タスクが見つかりません。
          </Typography>
        </Box>
      ) : (
        <Box sx={{ 
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          overflow: 'hidden',
          mx: isMobile ? 1 : 2
        }}>
          <List sx={{ p: 0 }}>
            {todos.map((task, index) => (
              <React.Fragment key={task.id}>
                <ListItem 
                  draggable={!isMobile}
                  onDragStart={(e) => !isMobile && handleDragStart(e, index, task.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={() => isMobile ? handleEditTask(task) : null}
                  onDoubleClick={() => !isMobile && handleEditTask(task)}
                  className={isMobile ? 'task-item-mobile' : ''}
                  sx={{ 
                    py: 1.5,
                    px: 2,
                    bgcolor: getTaskBackgroundColor(task),
                    borderLeft: isMobile ? 'none' : `4px solid ${getThemeColor('primary')}`,
                    '&:hover': { 
                      bgcolor: getThemeColor('background'),
                      cursor: isMobile ? 'pointer' : 'grab'
                    },
                    '&:active': {
                      cursor: isMobile ? 'pointer' : 'grabbing'
                    }
                  }}
                >
                  <Checkbox 
                    checked={task.status === 'completed'} 
                    onChange={(e) => {
                      e.stopPropagation(); // イベントの伝播を停止
                      toggleTaskCompletion(task.id, task.status);
                    }}
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
                      className={isMobile ? 'task-title-mobile' : ''}
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
                    <Box 
                      className={isMobile ? 'task-details-mobile' : ''}
                      sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: 'text.secondary' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <span className="emoji-icon" style={{ marginRight: '4px' }}>📅</span>
                        {task.startDate ? format(parseISO(task.startDate), 'yyyy年MM月dd日', { locale: ja }) : '期限なし'}
                      </Box>
                      {task.starred && (
                        <Box 
                          className={isMobile ? 'task-meta-item-mobile' : ''}
                          sx={{ display: 'flex', alignItems: 'center', ml: 2 }}
                        >
                          <span className="emoji-icon" style={{ marginRight: '4px' }}>⭐</span>
                          スター付き
                        </Box>
                      )}
                      {/* マイリスト名を表示 */}
                      {task.listId && (
                        <Box 
                          className={isMobile ? 'task-meta-item-mobile' : ''}
                          sx={{ display: 'flex', alignItems: 'center', ml: 2 }}
                        >
                          <span className="emoji-icon" style={{ marginRight: '4px' }}>📁</span>
                          {getTaskListName(task)}
                        </Box>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: isMobile ? 'none' : 'flex', alignItems: 'center' }}>
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

      {/* タスク削除確認ダイアログ */}
      <Dialog
        open={deleteTaskDialogOpen}
        onClose={cancelDeleteTask}
        aria-labelledby="delete-task-dialog-title"
        aria-describedby="delete-task-dialog-description"
      >
        <DialogTitle id="delete-task-dialog-title">
          タスクの削除
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-task-dialog-description">
            このタスクを削除してもよろしいですか？この操作は元に戻せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteTask}>キャンセル</Button>
          <Button onClick={confirmDeleteTask} color="error" autoFocus>
            削除する
          </Button>
        </DialogActions>
      </Dialog>

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
    </Box>
  );
};

export default TodoList;
