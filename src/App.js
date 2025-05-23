import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Box, Paper } from '@mui/material';
import Header from './components/Header';
import TodoList from './components/TodoList';
import AddTodo from './components/AddTodo';
import { AuthProvider } from './contexts/AuthContext';
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

  // 認証状態が変わったときにTodoを読み込む
  useEffect(() => {
    if (isAuthenticated) {
      // ここでGoogle Calendar APIからTodoを取得する
      // 現段階ではダミーデータを使用
      const dummyTodos = [
        { id: '1', title: 'React学習', completed: false, due: '2025-05-25' },
        { id: '2', title: 'Google Calendar API調査', completed: true, due: '2025-05-24' },
        { id: '3', title: 'UIデザイン作成', completed: false, due: '2025-05-26' },
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider value={{ isAuthenticated, setIsAuthenticated }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          <Container maxWidth="md" sx={{ mt: 4, mb: 4, flex: 1 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
              {isAuthenticated ? (
                <>
                  <AddTodo onAddTodo={handleAddTodo} />
                  <TodoList
                    todos={todos}
                    onToggle={handleToggleTodo}
                    onDelete={handleDeleteTodo}
                  />
                </>
              ) : (
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
              )}
            </Paper>
          </Container>
        </Box>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
