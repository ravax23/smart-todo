import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useCategories } from '../../contexts/CategoryContext';

function CategoryList({ onEditCategory }) {
  const { categories, deleteCategory } = useCategories();

  const handleDelete = (id) => {
    if (window.confirm('このカテゴリを削除してもよろしいですか？')) {
      deleteCategory(id);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        カテゴリ一覧
      </Typography>
      <List>
        {categories.map((category) => (
          <React.Fragment key={category.id}>
            <ListItem
              sx={{
                borderLeft: `4px solid ${category.color}`,
                bgcolor: 'background.paper',
                mb: 1,
                borderRadius: 1,
              }}
            >
              <ListItemText primary={category.name} />
              <IconButton edge="end" onClick={() => onEditCategory(category)}>
                <EditIcon />
              </IconButton>
              <IconButton edge="end" onClick={() => handleDelete(category.id)}>
                <DeleteIcon />
              </IconButton>
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
}

export default CategoryList;
