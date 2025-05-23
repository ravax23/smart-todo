import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import CategoryList from './CategoryList';
import CategoryForm from './CategoryForm';

function CategoryManagement() {
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const handleOpenForm = (category = null) => {
    setEditingCategory(category);
    setOpen(true);
  };

  const handleCloseForm = () => {
    setOpen(false);
    setEditingCategory(null);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">カテゴリ管理</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
        >
          新規カテゴリ
        </Button>
      </Box>

      <CategoryList onEditCategory={handleOpenForm} />
      
      <CategoryForm
        open={open}
        onClose={handleCloseForm}
        editingCategory={editingCategory}
      />
    </Box>
  );
}

export default CategoryManagement;
