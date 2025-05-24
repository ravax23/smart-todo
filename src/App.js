import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { TodoProvider } from './contexts/TodoContext';
import LoginButton from './components/LoginButton';
import TodoList from './components/TodoList';
import { Box, Container, Typography, CssBaseline } from '@mui/material';
import { useAuth } from './contexts/AuthContext';

// 認証状態に応じてコンテンツを表示するコンポーネント
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <Typography>読み込み中...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <LoginButton />;
  }

  return (
    <TodoProvider>
      <TodoList />
    </TodoProvider>
  );
};

// メインのAppコンポーネント
function App() {
  return (
    <>
      <CssBaseline />
      <AuthProvider>
        <Container maxWidth="md">
          <Box sx={{ my: 4 }}>
            <AppContent />
          </Box>
        </Container>
      </AuthProvider>
    </>
  );
}

export default App;
