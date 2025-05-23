import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Box, Paper, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Header from './components/Header';
import TodoList from './components/TodoList';
import AddTodo from './components/AddTodo';
import Sidebar from './components/Sidebar';
import CategoryManagement from './components/categories/CategoryManagement';
import { AuthProvider } from './contexts/AuthContext';
import { CategoryProvider } from './contexts/CategoryContext';
import LoginButton from './components/LoginButton';

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
});

function App() {
  const [todos, setTodos] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('todos');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // 認証状態が変わったときにTodoを読み込む
  useEffect(() => {
    if (isAuthenticated) {
      // ここでGoogle Calendar APIからTodoを取得する
      // 現段階ではダミーデータを使用
      const dummyTodos = [
        { id: '1', title: 'React学習', completed: false, due: '2025-05-25', categoryId: 'work' },
        { id: '2', title: 'Google Calendar API調査', completed: true, due: '2025-05-24', categoryId: 'work' },
        { id: '3', title: 'UIデザイン作成', completed: false, due: '2025-05-26', categoryId: 'default' },
        { id: '4', title: '買い物リスト作成', completed: false, due: '2025-05-27', categoryId: 'shopping' },
        { id: '5', title: '映画鑑賞', completed: false, due: '2025-05-28', categoryId: 'personal' },
      ];
      setTodos(dummyTodos);
    }
  }, [isAuthenticated]);

  const handleAddTodo = (newTodo) => {
    // 新しいTodoを追加
    setTodos([...todos, { ...newTodo, id: Date.now().toString() }]);
  };

  const handleToggleTodo = (id) => {
    // Todoの完了状態を切り替え
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDeleteTodo = (id) => {
    // Todoを削除
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleNavigate = (view, categoryId = null) => {
    setCurrentView(view);
    if (view === 'category') {
      setSelectedCategoryId(categoryId);
    }
    setSidebarOpen(false);
  };

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 3,
          }}
        >
          <LoginButton />
        </Box>
      );
    }

    switch (currentView) {
      case 'categories':
        return <CategoryManagement />;
      case 'category':
        // カテゴリでフィルタリングされたTodoリスト
        return (
          <>
            <AddTodo onAddTodo={handleAddTodo} initialCategoryId={selectedCategoryId} />
            <TodoList
              todos={todos.filter(todo => todo.categoryId === selectedCategoryId)}
              onToggle={handleToggleTodo}
              onDelete={handleDeleteTodo}
            />
          </>
        );
      case 'settings':
        return <div>設定画面（開発中）</div>;
      case 'todos':
      default:
        return (
          <>
            <AddTodo onAddTodo={handleAddTodo} />
            <TodoList
              todos={todos}
              onToggle={handleToggleTodo}
              onDelete={handleDeleteTodo}
            />
          </>
        );
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider value={{ isAuthenticated, setIsAuthenticated }}>
        <CategoryProvider>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header>
              {isAuthenticated && (
                <IconButton
                  color="inherit"
                  edge="start"
                  onClick={() => setSidebarOpen(true)}
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
            </Header>
            
            {isAuthenticated && (
              <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onNavigate={handleNavigate}
              />
            )}
            
            <Container maxWidth="md" sx={{ mt: 4, mb: 4, flex: 1 }}>
              <Paper elevation={3} sx={{ p: 3 }}>
                {renderContent()}
              </Paper>
            </Container>
          </Box>
        </CategoryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
