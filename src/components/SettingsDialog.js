import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Typography,
  Box,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useTheme } from '../theme/ThemeContext';

const SettingsDialog = ({ open, onClose }) => {
  const { theme, setThemePreference } = useTheme();
  
  // テーマ設定の変更ハンドラー
  const handleThemeChange = (event) => {
    setThemePreference(event.target.value);
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
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
              value={theme === 'dark' ? 'dark' : 'light'}
              onChange={handleThemeChange}
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
              label="日付表示形式"
            >
              <MenuItem value="yyyy-MM-dd">YYYY-MM-DD</MenuItem>
              <MenuItem value="MM/dd/yyyy">MM/DD/YYYY</MenuItem>
              <MenuItem value="dd.MM.yyyy">DD.MM.YYYY</MenuItem>
              <MenuItem value="yyyy年MM月dd日">YYYY年MM月DD日</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel>完了タスクの表示期間</InputLabel>
            <Select
              value="1week"
              label="完了タスクの表示期間"
            >
              <MenuItem value="1day">1日前</MenuItem>
              <MenuItem value="3days">3日前</MenuItem>
              <MenuItem value="1week">1週間前</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button 
          onClick={onClose} 
          variant="contained"
          sx={{ 
            bgcolor: 'var(--primary-color)',
            '&:hover': {
              bgcolor: 'var(--secondary-color)'
            }
          }}
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;
