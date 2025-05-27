import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useCategories } from '../../contexts/CategoryContext';

function CategoryList({ onEdit, onDelete }) {
  const { categories } = useCategories();

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        マイリスト
      </Typography>
      
      {categories.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          マイリストがありません。新しいマイリストを作成してください。
        </Typography>
      ) : (
        <List>
          {categories.map((category) => (
            <ListItem
              key={category.id}
              secondaryAction={
                <Box>
                  <IconButton edge="end" aria-label="編集" onClick={() => onEdit(category)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="削除"
                    onClick={() => onDelete(category.id)}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
              sx={{
                borderRadius: 1,
                mb: 1,
                border: '1px solid #e0e0e0',
              }}
            >
              <ListItemIcon>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: category.color,
                  }}
                />
              </ListItemIcon>
              <ListItemText primary={category.name} />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}

export default CategoryList;
