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
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#ffffff',
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
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
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
      <Box sx={{ mt: 2 }}>
        <TodoList />
      </Box>
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
