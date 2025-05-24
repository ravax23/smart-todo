import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { TodoProvider } from './contexts/TodoContext';
import LoginButton from './components/LoginButton';
import TodoList from './components/TodoList';
import { Box, Container, Paper, Typography, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { useAuth } from './contexts/AuthContext';

// カスタムテーマの作成
const theme = createTheme({
  palette: {
    primary: {
      main: '#546e7a',
    },
    secondary: {
      main: '#78909c',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#37474f',
      secondary: '#78909c',
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
    h5: {
      fontWeight: 500,
    },
    subtitle1: {
      fontWeight: 500,
    },
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
          borderRadius: 8,
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
        <Typography>読み込み中...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          borderRadius: 2, 
          border: '1px solid #e0e0e0',
          bgcolor: 'background.paper'
        }}
      >
        <LoginButton />
      </Paper>
    );
  }

  return (
    <TodoProvider>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 2, 
          border: '1px solid #e0e0e0',
          bgcolor: 'background.paper'
        }}
      >
        <TodoList />
      </Paper>
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
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              sx={{ 
                mb: 4, 
                fontWeight: 'medium',
                color: 'text.primary',
                textAlign: 'center'
              }}
            >
              Todo アプリ
            </Typography>
            <AppContent />
          </Box>
        </Container>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
