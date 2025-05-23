import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import CalendarService from '../services/calendarService';

const TodoContext = createContext();

export const TodoProvider = ({ children }) => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  // 初期データの読み込み
  useEffect(() => {
    if (isAuthenticated) {
      fetchTodos();
    } else {
      setTodos([]);
      setLoading(false);
    }
  }, [isAuthenticated]);

  // 今日から7日間のTodoを取得
  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const today = new Date();
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(today.getDate() + 7);
      
      const timeMin = today.toISOString();
      const timeMax = sevenDaysLater.toISOString();
      
      const todoList = await CalendarService.getTodos(timeMin, timeMax);
      setTodos(todoList);
    } catch (err) {
      console.error('Failed to fetch todos:', err);
      setError('カレンダーデータの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // コンテキストの値
  const value = {
    todos,
    loading,
    error,
    fetchTodos,
  };

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
};

// Todoコンテキストを使用するためのカスタムフック
export const useTodo = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodo must be used within a TodoProvider');
  }
  return context;
};

export default TodoContext;
