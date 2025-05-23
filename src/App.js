import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Paper, CircularProgress } from '@mui/material';
import Header from './components/Header';
import TodoList from './components/TodoList';
import AddTodo from './components/AddTodo';
import Sidebar from './components/Sidebar';
import CategoryManagement from './components/categories/CategoryManagement';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CategoryProvider } from './contexts/CategoryContext';
import LoginButton from './components/LoginButton';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#757575',
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
    h6: {
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
          border: '1px solid #e0e0e0',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #f0f0f0',
          '&:last-child': {
            borderBottom: 'none',
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          padding: 8,
        },
      },
    },
  },
});

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [todos, setTodos] = useState([]);
  const [currentView, setCurrentView] = useState('todos');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');

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
      setSelectedDateFilter('all');
    } else if (view.startsWith('date_')) {
      setSelectedDateFilter(view.replace('date_', ''));
      setSelectedCategoryId(null);
      setCurrentView('todos');
    } else {
      setSelectedDateFilter('all');
    }
  };

  // 日付フィルターに基づいてTodoをフィルタリング
  const filterTodosByDate = (todoList) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const afterTomorrow = new Date(today);
    afterTomorrow.setDate(afterTomorrow.getDate() + 2);

    switch (selectedDateFilter) {
      case 'today':
        return todoList.filter(todo => {
          if (!todo.due) return false;
          const dueDate = new Date(todo.due);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime();
        });
      case 'tomorrow':
        return todoList.filter(todo => {
          if (!todo.due) return false;
          const dueDate = new Date(todo.due);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === tomorrow.getTime();
        });
      case 'after_tomorrow':
        return todoList.filter(todo => {
          if (!todo.due) return false;
          const dueDate = new Date(todo.due);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === afterTomorrow.getTime();
        });
      case 'past':
        return todoList.filter(todo => {
          if (!todo.due) return false;
          const dueDate = new Date(todo.due);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() < today.getTime();
        });
      default:
        return todoList;
    }
  };

  // 現在の表示に基づいてフィルタリングされたTodoを取得
  const getFilteredTodos = () => {
    let filteredTodos = [...todos];
    
    // カテゴリでフィルタリング
    if (currentView === 'category' && selectedCategoryId) {
      filteredTodos = filteredTodos.filter(todo => todo.categoryId === selectedCategoryId);
    }
    
    // 日付でフィルタリング
    return filterTodosByDate(filteredTodos);
  };

  // 現在のビューに基づいてタイトルを取得
  const getViewTitle = () => {
    if (currentView === 'categories') {
      return 'カテゴリ管理';
    } else if (currentView === 'category' && selectedCategoryId) {
      // カテゴリ名を取得するロジックが必要
      return 'カテゴリ別タスク';
    } else {
      switch (selectedDateFilter) {
        case 'today': return '今日';
        case 'tomorrow': return '明日';
        case 'after_tomorrow': return '明後日';
        case 'past': return '過去のタスク';
        default: return 'すべてのタスク';
      }
    }
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

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
        return (
          <>
            <AddTodo onAddTodo={handleAddTodo} initialCategoryId={selectedCategoryId} />
            <TodoList
              todos={getFilteredTodos()}
              onToggle={handleToggleTodo}
              onDelete={handleDeleteTodo}
            />
          </>
        );
      case 'todos':
      default:
        return (
          <>
            <AddTodo onAddTodo={handleAddTodo} />
            <TodoList
              todos={getFilteredTodos()}
              onToggle={handleToggleTodo}
              onDelete={handleDeleteTodo}
            />
          </>
        );
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {isAuthenticated && (
        <Sidebar
          onNavigate={handleNavigate}
          selectedCategory={selectedCategoryId}
          selectedDateFilter={selectedDateFilter}
          todos={todos}
        />
      )}
      
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: 'background.default'
      }}>
        <Header title={getViewTitle()} />
        
        <Box sx={{ 
          p: 2, 
          flexGrow: 1,
          overflow: 'auto',
        }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2,
              height: '100%',
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {renderContent()}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CategoryProvider>
          <AppContent />
        </CategoryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
