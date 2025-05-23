import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TodoProvider } from './contexts/TodoContext';
import LoginButton from './components/LoginButton';
import TodoList from './components/TodoList';
import { Box, Container } from '@mui/material';

// 認証状態に応じてコンテンツを表示するコンポーネント
const AuthenticatedContent = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <>
      {isAuthenticated ? (
        <TodoProvider>
          <TodoList />
        </TodoProvider>
      ) : (
        <LoginButton />
      )}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <AuthenticatedContent />
        </Box>
      </Container>
    </AuthProvider>
  );
}

export default App;
