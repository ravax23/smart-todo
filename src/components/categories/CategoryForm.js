import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import { useCategories } from '../../contexts/CategoryContext';

const colors = [
  { id: 'red', value: '#f44336', name: 'レッド' },
  { id: 'pink', value: '#e91e63', name: 'ピンク' },
  { id: 'purple', value: '#9c27b0', name: 'パープル' },
  { id: 'deepPurple', value: '#673ab7', name: 'ディープパープル' },
  { id: 'indigo', value: '#3f51b5', name: 'インディゴ' },
  { id: 'blue', value: '#2196f3', name: 'ブルー' },
  { id: 'lightBlue', value: '#03a9f4', name: 'ライトブルー' },
  { id: 'cyan', value: '#00bcd4', name: 'シアン' },
  { id: 'teal', value: '#009688', name: 'ティール' },
  { id: 'green', value: '#4caf50', name: 'グリーン' },
  { id: 'lightGreen', value: '#8bc34a', name: 'ライトグリーン' },
  { id: 'lime', value: '#cddc39', name: 'ライム' },
  { id: 'yellow', value: '#ffeb3b', name: 'イエロー' },
  { id: 'amber', value: '#ffc107', name: 'アンバー' },
  { id: 'orange', value: '#ff9800', name: 'オレンジ' },
  { id: 'deepOrange', value: '#ff5722', name: 'ディープオレンジ' },
  { id: 'brown', value: '#795548', name: 'ブラウン' },
  { id: 'grey', value: '#9e9e9e', name: 'グレー' },
  { id: 'blueGrey', value: '#607d8b', name: 'ブルーグレー' },
];

function CategoryForm({ category = null, onSubmit, onCancel }) {
  const [name, setName] = useState(category ? category.name : '');
  const [color, setColor] = useState(category ? category.color : colors[0].value);
  const [nameError, setNameError] = useState('');
  const { categories } = useCategories();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 名前の検証
    if (!name.trim()) {
      setNameError('マイリスト名を入力してください');
      return;
    }
    
    // 既存のマイリスト名との重複チェック（編集時は自分自身を除外）
    const isDuplicate = categories.some(
      (cat) => cat.name.toLowerCase() === name.trim().toLowerCase() && 
      (!category || cat.id !== category.id)
    );
    
    if (isDuplicate) {
      setNameError('同じ名前のマイリストが既に存在します');
      return;
    }
    
    onSubmit({
      id: category ? category.id : null,
      name: name.trim(),
      color,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {category ? 'マイリストを編集' : '新しいマイリストを作成'}
      </Typography>
      
      <TextField
        fullWidth
        label="マイリスト名"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setNameError('');
        }}
        error={!!nameError}
        helperText={nameError}
        margin="normal"
        required
      />
      
      <FormControl fullWidth margin="normal">
        <InputLabel>色</InputLabel>
        <Select value={color} onChange={(e) => setColor(e.target.value)} label="色">
          {colors.map((colorOption) => (
            <MenuItem key={colorOption.id} value={colorOption.value}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: colorOption.value,
                    mr: 1,
                  }}
                />
                {colorOption.name}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1 }}>
        <Button variant="outlined" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit" variant="contained">
          {category ? '更新' : '作成'}
        </Button>
      </Box>
    </Box>
  );
}

export default CategoryForm;
