import React from 'react';
import { 
  Box, 
  IconButton, 
  Tooltip, 
  Badge,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { useTodo } from '../contexts/TodoContext';

/**
 * 同期状態を表示するコンポーネント
 */
const SyncStatusIndicator = () => {
  const { syncStatus, manualSync, loading } = useTodo();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  
  // 同期状態に基づいてアイコンを決定
  const getSyncIcon = () => {
    if (syncStatus.isSyncing) {
      return <CircularProgress size={20} />;
    }
    
    // 同期キューにアイテムがある場合
    if (syncStatus.queueLength > 0) {
      return (
        <Badge 
          badgeContent={syncStatus.queueLength} 
          color="warning"
          max={99}
        >
          <Box component="span" sx={{ fontSize: '1.2rem' }} className="emoji-icon">🔄</Box>
        </Badge>
      );
    }
    
    // 最後の同期時刻がある場合
    if (syncStatus.lastSyncTime) {
      const lastSyncDate = new Date(syncStatus.lastSyncTime);
      const now = new Date();
      const diffMinutes = Math.floor((now - lastSyncDate) / (1000 * 60));
      
      // 5分以内に同期した場合は緑色のアイコン
      if (diffMinutes < 5) {
        return <Box component="span" sx={{ fontSize: '1.2rem', color: 'success.main' }} className="emoji-icon">✅</Box>;
      }
      
      // 30分以内に同期した場合は青色のアイコン
      if (diffMinutes < 30) {
        return <Box component="span" sx={{ fontSize: '1.2rem', color: 'info.main' }} className="emoji-icon">🔄</Box>;
      }
      
      // それ以外の場合は灰色のアイコン
      return <Box component="span" sx={{ fontSize: '1.2rem', color: 'text.secondary' }} className="emoji-icon">🔄</Box>;
    }
    
    // デフォルトのアイコン
    return <Box component="span" sx={{ fontSize: '1.2rem', color: 'text.secondary' }} className="emoji-icon">🔄</Box>;
  };
  
  // 同期状態のテキストを取得
  const getSyncStatusText = () => {
    if (syncStatus.isSyncing) {
      return '同期中...';
    }
    
    if (syncStatus.queueLength > 0) {
      return `${syncStatus.queueLength}件の変更が同期待ち`;
    }
    
    if (syncStatus.lastSyncTime) {
      const lastSyncDate = new Date(syncStatus.lastSyncTime);
      return `最終同期: ${lastSyncDate.toLocaleTimeString()}`;
    }
    
    return '未同期';
  };
  
  // ダイアログを開く
  const handleOpenDialog = () => {
    setDialogOpen(true);
  };
  
  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  
  // 手動同期を実行
  const handleManualSync = async () => {
    await manualSync();
    handleCloseDialog();
  };
  
  // 保留中の変更の詳細を表示
  const renderPendingChanges = () => {
    if (!syncStatus.pendingChanges) return null;
    
    const { taskLists, tasks } = syncStatus.pendingChanges;
    const hasPendingChanges = 
      taskLists.created > 0 || 
      taskLists.updated > 0 || 
      taskLists.deleted > 0 ||
      tasks.created > 0 || 
      tasks.updated > 0 || 
      tasks.deleted > 0 ||
      tasks.reordered > 0;
    
    if (!hasPendingChanges) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          保留中の変更はありません
        </Typography>
      );
    }
    
    return (
      <List dense>
        {taskLists.created > 0 && (
          <ListItem>
            <ListItemText 
              primary={`マイリスト作成: ${taskLists.created}件`}
            />
          </ListItem>
        )}
        
        {taskLists.updated > 0 && (
          <ListItem>
            <ListItemText 
              primary={`マイリスト更新: ${taskLists.updated}件`}
            />
          </ListItem>
        )}
        
        {taskLists.deleted > 0 && (
          <ListItem>
            <ListItemText 
              primary={`マイリスト削除: ${taskLists.deleted}件`}
            />
          </ListItem>
        )}
        
        {(taskLists.created > 0 || taskLists.updated > 0 || taskLists.deleted > 0) && (
          <Divider sx={{ my: 1 }} />
        )}
        
        {tasks.created > 0 && (
          <ListItem>
            <ListItemText 
              primary={`タスク作成: ${tasks.created}件`}
            />
          </ListItem>
        )}
        
        {tasks.updated > 0 && (
          <ListItem>
            <ListItemText 
              primary={`タスク更新: ${tasks.updated}件`}
            />
          </ListItem>
        )}
        
        {tasks.deleted > 0 && (
          <ListItem>
            <ListItemText 
              primary={`タスク削除: ${tasks.deleted}件`}
            />
          </ListItem>
        )}
        
        {tasks.reordered > 0 && (
          <ListItem>
            <ListItemText 
              primary={`タスク並び替え: ${tasks.reordered}件`}
            />
          </ListItem>
        )}
      </List>
    );
  };
  
  return (
    <>
      <Tooltip title={getSyncStatusText()}>
        <IconButton 
          size="small" 
          onClick={handleOpenDialog}
          disabled={loading}
          sx={{ 
            color: 'text.secondary',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
          }}
        >
          {getSyncIcon()}
        </IconButton>
      </Tooltip>
      
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>同期状態</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              {getSyncStatusText()}
            </Typography>
            
            {syncStatus.lastSyncTime && (
              <Typography variant="body2" color="text.secondary">
                最終同期日時: {new Date(syncStatus.lastSyncTime).toLocaleString()}
              </Typography>
            )}
          </Box>
          
          <Typography variant="subtitle1" gutterBottom>
            保留中の変更
          </Typography>
          
          {renderPendingChanges()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>閉じる</Button>
          <Button 
            onClick={handleManualSync} 
            variant="contained" 
            disabled={loading || syncStatus.isSyncing}
            startIcon={syncStatus.isSyncing ? <CircularProgress size={16} /> : null}
          >
            {syncStatus.isSyncing ? '同期中...' : '今すぐ同期'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SyncStatusIndicator;
