import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography,
  CircularProgress,
  Box
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

const AuthErrorHandler = () => {
  const { authError, clearError } = useAuth();
  const [countdown, setCountdown] = useState(3);
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  const redirectTimerRef = useRef(null);

  useEffect(() => {
    if (authError) {
      setOpen(true);
      setCountdown(3);
      
      // カウントダウンタイマー
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // 3秒後に自動リダイレクト
      redirectTimerRef.current = setTimeout(() => {
        clearError();
        window.location.reload();
      }, 3000);
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        if (redirectTimerRef.current) {
          clearTimeout(redirectTimerRef.current);
        }
      };
    }
  }, [authError, clearError]);

  const handleClose = () => {
    // タイマーをクリア
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
    }
    
    setOpen(false);
    clearError();
  };

  const handleLoginNow = () => {
    // タイマーをクリア
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
    }
    
    clearError();
    window.location.reload();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={countdown <= 0} // カウントダウン終了後はESCキーを無効化
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        セッション期限切れ
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          {authError}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {countdown > 0 ? (
            <>
              {countdown}秒後に自動的にログイン画面に移動します...
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} />
              </Box>
            </>
          ) : (
            'ログイン画面に移動しています...'
          )}
        </Typography>
      </DialogContent>
      <DialogActions>
        {countdown > 0 && (
          <Button onClick={handleClose} color="secondary">
            キャンセル
          </Button>
        )}
        <Button 
          onClick={handleLoginNow} 
          color="primary" 
          variant="contained"
          disabled={countdown <= 0}
        >
          今すぐログイン
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuthErrorHandler;
