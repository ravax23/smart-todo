import React, { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { TodoProvider } from './contexts/TodoContext';
import { CategoryProvider } from './contexts/CategoryContext';
import UserMenu from './components/UserMenu';
import LoginButton from './components/LoginButton';
import TodoList from './components/TodoList';
import Sidebar from './components/Sidebar';
import { Box, Container, CssBaseline, ThemeProvider, createTheme, Typography } from '@mui/material';
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

  // URLハッシュからアクセストークンを取得
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      try {
        const accessToken = hash.match(/access_token=([^&]*)/)[1];
        if (accessToken) {
          console.log('Got access token from URL hash');
          localStorage.setItem('google_access_token', accessToken);
          
          // URLからハッシュを削除
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // 認証状態を更新
          const event = new CustomEvent('googleAuthStateChanged', { 
            detail: { isAuthenticated: true } 
          });
          window.dispatchEvent(event);
          
          // ページをリロード
          window.location.reload();
        }
      } catch (error) {
        console.error('Error processing auth redirect:', error);
      }
    }
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <div>読み込み中...</div>
      </Box>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        <TodoProvider>
          <CategoryProvider>
            <Box sx={{ display: 'flex', minHeight: '100vh', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
              <Sidebar />
              <Box sx={{ flex: 1, bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
                <TodoList />
              </Box>
            </Box>
          </CategoryProvider>
        </TodoProvider>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}>
          <Box sx={{ 
            p: 4, 
            bgcolor: 'background.paper', 
            borderRadius: 2, 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            maxWidth: 400,
            width: '100%',
            textAlign: 'center'
          }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              SmartTodo
            </Typography>
            <LoginButton />
          </Box>
        </Box>
      )}
    </>
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
