import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Typography,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useCategories } from '../../contexts/CategoryContext';
import CategoryList from './CategoryList';
import CategoryForm from './CategoryForm';

function CategoryManagement() {
  const [openForm, setOpenForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);
  const { addCategory, updateCategory, deleteCategory } = useCategories();

  const handleOpenForm = (category = null) => {
    setEditingCategory(category);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingCategory(null);
  };

  const handleSubmit = (categoryData) => {
    if (editingCategory) {
      updateCategory(categoryData.id, categoryData);
    } else {
      addCategory(categoryData);
    }
    handleCloseForm();
  };

  const handleDeleteClick = (categoryId) => {
    setDeletingCategoryId(categoryId);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (deletingCategoryId) {
      deleteCategory(deletingCategoryId);
      setOpenDeleteDialog(false);
      setDeletingCategoryId(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">マイリスト管理</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
        >
          新規マイリスト
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <CategoryList onEdit={handleOpenForm} onDelete={handleDeleteClick} />

      {/* マイリスト作成/編集フォームダイアログ */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogContent>
          <CategoryForm
            category={editingCategory}
            onSubmit={handleSubmit}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>マイリストの削除</DialogTitle>
        <DialogContent>
          <Typography>
            このマイリストを削除してもよろしいですか？この操作は元に戻せません。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>キャンセル</Button>
          <Button onClick={handleConfirmDelete} color="error">
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CategoryManagement;
