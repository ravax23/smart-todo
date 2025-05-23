import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { useCategories } from '../../contexts/CategoryContext';

function CategoryForm({ open, onClose, editingCategory }) {
  const { addCategory, updateCategory } = useCategories();
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#1976d2');
  const [error, setError] = useState('');

  // 編集モードの場合、フォームに値をセット
  useEffect(() => {
    if (editingCategory) {
      setCategoryName(editingCategory.name);
      setCategoryColor(editingCategory.color);
    } else {
      setCategoryName('');
      setCategoryColor('#1976d2');
    }
    setError('');
  }, [editingCategory, open]);

  const handleSave = () => {
    if (!categoryName.trim()) {
      setError('カテゴリ名を入力してください');
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: categoryName.trim(),
        color: categoryColor,
      });
    } else {
      addCategory({
        name: categoryName.trim(),
        color: categoryColor,
      });
    }

    onClose();
  };

  // カラーピッカーの代わりにプリセットカラーを使用
  const presetColors = [
    '#1976d2', // 青
    '#f44336', // 赤
    '#4caf50', // 緑
    '#ff9800', // オレンジ
    '#9c27b0', // 紫
    '#00bcd4', // シアン
    '#ffeb3b', // 黄色
    '#795548', // 茶色
    '#607d8b', // グレー
  ];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{editingCategory ? 'カテゴリを編集' : '新規カテゴリ'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="カテゴリ名"
          fullWidth
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          error={!!error}
          helperText={error}
        />
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            カラー
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {presetColors.map((color) => (
              <Box
                key={color}
                onClick={() => setCategoryColor(color)}
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: color,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  border: categoryColor === color ? '2px solid black' : 'none',
                }}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSave} color="primary">
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CategoryForm;
