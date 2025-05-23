import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
} from '@mui/material';
import {
  FormatListBulleted as ListIcon,
  Category as CategoryIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useCategories } from '../contexts/CategoryContext';

function Sidebar({ open, onClose, onNavigate }) {
  const { categories } = useCategories();

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 250 }} role="presentation">
        <List>
          <ListItem button onClick={() => onNavigate('todos')}>
            <ListItemIcon>
              <ListIcon />
            </ListItemIcon>
            <ListItemText primary="すべてのタスク" />
          </ListItem>
          <Divider />
          <ListItem button onClick={() => onNavigate('categories')}>
            <ListItemIcon>
              <CategoryIcon />
            </ListItemIcon>
            <ListItemText primary="カテゴリ管理" />
          </ListItem>
          <Divider />
          {categories.map((category) => (
            <ListItem
              button
              key={category.id}
              onClick={() => onNavigate('category', category.id)}
              sx={{ pl: 4 }}
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
      </Box>
    </Drawer>
  );
}

export default Sidebar;
