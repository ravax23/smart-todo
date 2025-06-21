import React, { useEffect, useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { TodoProvider } from './contexts/TodoContext';
import { CategoryProvider } from './contexts/CategoryContext';
import LoginButton from './components/LoginButton';
import TodoList from './components/TodoList';
import Sidebar from './components/Sidebar';
import { Box, Container, CssBaseline, ThemeProvider, createTheme, Typography, IconButton, useMediaQuery } from '@mui/material';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width:768px)');

  // URLハッシュからアクセストークンを取得
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      try {
        const accessToken = hash.match(/access_token=([^&]*)/)[1];
        if (accessToken) {
          console.log('Got access token from URL hash in App.js');
          
          // モバイル環境を検出
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          console.log('Device detection in App.js:', isMobile ? 'Mobile' : 'Desktop');
          
          try {
            localStorage.setItem('google_access_token', accessToken);
            console.log('Access token saved to localStorage in App.js');
            
            // セッションストレージにもバックアップ（iOSのプライベートブラウジングモード対策）
            sessionStorage.setItem('google_access_token', accessToken);
            console.log('Access token saved to sessionStorage in App.js');
          } catch (storageError) {
            console.error('Error saving to storage in App.js:', storageError);
          }
          
          // URLからハッシュを削除
          try {
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (historyError) {
            console.error('Error updating history in App.js:', historyError);
          }
          
          // 認証状態を更新
          try {
            const event = new CustomEvent('googleAuthStateChanged', { 
              detail: { isAuthenticated: true } 
            });
            window.dispatchEvent(event);
            console.log('Auth state change event dispatched from App.js');
          } catch (eventError) {
            console.error('Error dispatching event in App.js:', eventError);
          }
          
          // ページをリロード
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      } catch (error) {
        console.error('Error processing auth redirect in App.js:', error);
      }
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

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
            <Box sx={{ display: 'flex', minHeight: '100%' }}>
              {/* モバイルメニューボタン */}
              {isMobile && (
                <IconButton
                  className="mobile-menu-button"
                  onClick={toggleSidebar}
                  sx={{
                    position: 'fixed',
                    top: '10px',
                    left: '10px',
                    zIndex: 1300,
                    bgcolor: 'background.paper',
                    width: '40px',
                    height: '40px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    '&:hover': { bgcolor: 'background.default' }
                  }}
                >
                  <Box component="span" sx={{ fontSize: '1.5rem', lineHeight: 1 }}>☰</Box>
                </IconButton>
              )}
              
              {/* サイドバー */}
              <Box 
                className={`${isMobile ? 'sidebar-mobile' : ''} ${sidebarOpen ? 'open' : ''}`}
                sx={{ 
                  width: 320,
                  bgcolor: 'background.paper',
                  borderRight: '1px solid #e0e0e0',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Sidebar closeSidebar={closeSidebar} isMobile={isMobile} />
              </Box>
              
              {/* メインコンテンツ */}
              <Box 
                className={isMobile ? 'main-content-mobile' : ''}
                sx={{ 
                  flex: 1, 
                  bgcolor: 'background.default', 
                  display: 'flex', 
                  flexDirection: 'column',
                  width: '100%'
                }}
              >
                <TodoList isMobile={isMobile} />
              </Box>
              
              {/* モバイルでサイドバーが開いているときの背景オーバーレイ */}
              {isMobile && sidebarOpen && (
                <Box
                  onClick={closeSidebar}
                  sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(0,0,0,0.5)',
                    zIndex: 1100
                  }}
                />
              )}
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
            textAlign: 'center',
            mx: 'auto', // 中央揃えを確実にするため
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
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
