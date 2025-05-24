import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { TodoProvider } from './contexts/TodoContext';
import LoginButton from './components/LoginButton';
import TodoList from './components/TodoList';
import { Box, Container, CssBaseline, createTheme, ThemeProvider } from '@mui/material';
import { useAuth } from './contexts/AuthContext';

// カスタムテーマの作成
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

// 認証状態に応じてコンテンツを表示するコンポーネント
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <div>読み込み中...</div>
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Container maxWidth="md">
          <Box sx={{ my: 4 }}>
            <AppContent />
          </Box>
        </Container>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
