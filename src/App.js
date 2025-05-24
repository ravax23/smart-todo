import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { TodoProvider } from './contexts/TodoContext';
import LoginButton from './components/LoginButton';
import TodoList from './components/TodoList';
import Sidebar from './components/Sidebar';
import { Box, Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { useAuth } from './contexts/AuthContext';

// カスタムテーマの作成
const theme = createTheme({
  palette: {
    primary: {
      main: '#2c3e50',
      light: '#ecf0f1',
    },
    secondary: {
      main: '#3498db',
    },
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
    },
    background: {
      default: '#f9fafb',
      paper: '#ffffff',
    },
    categories: {
      workHisys: '#e74c3c',
      workInternal: '#3498db',
      personal: '#2ecc71',
    }
  },
  typography: {
    fontFamily: [
      'Poppins',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
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
      <Box sx={{ display: 'flex', minHeight: '100vh', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        <Sidebar />
        <Box sx={{ flex: 1, p: 4, bgcolor: 'background.paper' }}>
          <TodoList />
        </Box>
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
        <Box sx={{ maxWidth: '1440px', margin: '0 auto' }}>
          <AppContent />
        </Box>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
