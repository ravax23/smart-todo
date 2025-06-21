import React, { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Typography,
  CircularProgress,
  Alert,
  Box,
  LinearProgress
} from '@mui/material';
import { migrateTasksToDb } from '../scripts/migrateToDb';
import { useAuth } from '../contexts/AuthContext';

/**
 * データ移行ダイアログコンポーネント
 * Google Tasks APIからDynamoDBへのデータ移行を実行するためのダイアログ
 */
const DataMigrationDialog = ({ open, onClose }) => {
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState(null);
  const { user } = useAuth();
  
  /**
   * データ移行を実行する
   */
  const handleMigration = async () => {
    setMigrating(true);
    setResult(null);
    
    try {
      // ユーザーIDを取得（メールアドレスをIDとして使用）
      const userId = user.email;
      
      // データ移行を実行
      const migrationResult = await migrateTasksToDb(userId);
      setResult(migrationResult);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setMigrating(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Google TasksからDynamoDBへのデータ移行</DialogTitle>
      <DialogContent>
        <Typography paragraph>
          Google Tasks APIからAWS DynamoDBにすべてのタスクとリストを移行します。
          このプロセスはバックグラウンドで実行され、データ量によっては数分かかる場合があります。
        </Typography>
        
        <Typography paragraph>
          <strong>注意:</strong> 移行中はアプリを閉じたり、ページを更新したりしないでください。
        </Typography>
        
        {migrating && (
          <Box sx={{ width: '100%', mt: 3, mb: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              データを移行中...しばらくお待ちください
            </Typography>
          </Box>
        )}
        
        {result && (
          <Alert severity={result.success ? 'success' : 'error'} sx={{ mt: 2 }}>
            {result.success ? (
              <>
                {result.message}
                {result.stats && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    移行されたリスト数: {result.stats.lists}
                  </Typography>
                )}
              </>
            ) : (
              `エラー: ${result.error}`
            )}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={migrating}>
          {result && result.success ? '閉じる' : 'キャンセル'}
        </Button>
        <Button 
          onClick={handleMigration} 
          color="primary" 
          variant="contained" 
          disabled={migrating}
          startIcon={migrating ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {migrating ? '移行中...' : '移行を開始'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DataMigrationDialog;
