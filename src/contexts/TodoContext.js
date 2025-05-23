import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import CalendarService from '../services/calendarService';

// Todoコンテキストの作成
const TodoContext = createContext();

// Todoプロバイダーコンポーネント
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

  // 今日から30日間のTodoを取得
  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const today = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(today.getDate() + 30);
      
      const timeMin = today.toISOString();
      const timeMax = thirtyDaysLater.toISOString();
      
      const todoList = await CalendarService.getTodos(timeMin, timeMax);
      setTodos(todoList);
    } catch (err) {
      console.error('Failed to fetch todos:', err);
      setError('Todoの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // 新しいTodoを追加
  const addTodo = async (todo) => {
    try {
      setLoading(true);
      setError(null);
      
      const newTodo = await CalendarService.createTodo(todo);
      setTodos([...todos, newTodo]);
      return newTodo;
    } catch (err) {
      console.error('Failed to add todo:', err);
      setError('Todoの追加に失敗しました。');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Todoを更新
  const updateTodo = async (id, updatedTodo) => {
    try {
      setLoading(true);
      setError(null);
      
      const updated = await CalendarService.updateTodo(id, updatedTodo);
      setTodos(todos.map(todo => todo.id === id ? updated : todo));
      return updated;
    } catch (err) {
      console.error('Failed to update todo:', err);
      setError('Todoの更新に失敗しました。');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Todoを削除
  const deleteTodo = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      await CalendarService.deleteTodo(id);
      setTodos(todos.filter(todo => todo.id !== id));
      return true;
    } catch (err) {
      console.error('Failed to delete todo:', err);
      setError('Todoの削除に失敗しました。');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Todoの完了状態を切り替え
  const toggleTodoCompletion = async (id) => {
    const todo = todos.find(todo => todo.id === id);
    if (!todo) return;
    
    const updatedTodo = { ...todo, completed: !todo.completed };
    return updateTodo(id, updatedTodo);
  };

  // コンテキストの値
  const value = {
    todos,
    loading,
    error,
    fetchTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodoCompletion,
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
