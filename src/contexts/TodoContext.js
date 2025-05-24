import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import TasksService from '../services/tasksService';
import { requestTasksScope } from '../services/authService';

const TodoContext = createContext();

export const TodoProvider = ({ children }) => {
  const [todos, setTodos] = useState([]);
  const [taskLists, setTaskLists] = useState([]);
  const [selectedTaskList, setSelectedTaskList] = useState('@default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  // 初期データの読み込み
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User is authenticated, fetching task lists');
      fetchTaskLists();
    } else {
      console.log('User is not authenticated, skipping task fetch');
      setTaskLists([]);
      setTodos([]);
      setLoading(false);
    }
  }, [isAuthenticated]);

  // タスクリストが選択されたときにタスクを取得
  useEffect(() => {
    if (isAuthenticated && selectedTaskList) {
      console.log(`Selected task list changed to: ${selectedTaskList}`);
      fetchTasks(selectedTaskList);
    }
  }, [isAuthenticated, selectedTaskList]);

  // タスクリストの取得
  const fetchTaskLists = async () => {
    try {
      console.log('Starting fetchTaskLists');
      setLoading(true);
      setError(null);
      
      try {
        const lists = await TasksService.getTaskLists();
        console.log('Received task lists:', lists);
        setTaskLists(lists);
        
        // デフォルトのタスクリストを選択
        if (lists && lists.length > 0) {
          const defaultList = lists.find(list => list.title === 'マイタスク') || lists[0];
          setSelectedTaskList(defaultList.id);
        }
      } catch (err) {
        console.error('Failed to fetch task lists:', err);
        
        // スコープ不足エラーの場合、明示的なスコープ承認を要求
        if (err.message && err.message.includes('insufficient authentication scopes')) {
          console.log('Insufficient scopes detected, requesting explicit authorization');
          const success = await requestTasksScope();
          
          if (success) {
            // スコープ承認に成功したら再度取得を試みる
            console.log('Scope authorization successful, retrying fetch');
            const lists = await TasksService.getTaskLists();
            console.log('Received task lists after scope authorization:', lists);
            setTaskLists(lists);
            
            // デフォルトのタスクリストを選択
            if (lists && lists.length > 0) {
              const defaultList = lists.find(list => list.title === 'マイタスク') || lists[0];
              setSelectedTaskList(defaultList.id);
            }
            return;
          } else {
            setError('タスクへのアクセス権限が不足しています。タスクへのアクセスを許可してください。');
          }
        } else {
          setError(`タスクリストの取得に失敗しました。${err.message}`);
        }
      } finally {
        if (!selectedTaskList) {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Error in fetchTaskLists:', err);
      setError(`タスクリストの取得に失敗しました。${err.message}`);
      setLoading(false);
    }
  };

  // タスクの取得
  const fetchTasks = async (taskListId = selectedTaskList) => {
    try {
      console.log(`Starting fetchTasks for list: ${taskListId}`);
      setLoading(true);
      setError(null);
      
      try {
        const todoList = await TasksService.getTasks(taskListId);
        console.log('Received tasks:', todoList);
        setTodos(todoList);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        
        // スコープ不足エラーの場合、明示的なスコープ承認を要求
        if (err.message && err.message.includes('insufficient authentication scopes')) {
          console.log('Insufficient scopes detected, requesting explicit authorization');
          const success = await requestTasksScope();
          
          if (success) {
            // スコープ承認に成功したら再度取得を試みる
            console.log('Scope authorization successful, retrying fetch');
            const todoList = await TasksService.getTasks(taskListId);
            console.log('Received tasks after scope authorization:', todoList);
            setTodos(todoList);
            return;
          } else {
            setError('タスクへのアクセス権限が不足しています。タスクへのアクセスを許可してください。');
          }
        } else {
          setError(`タスクの取得に失敗しました。${err.message}`);
        }
      }
    } catch (err) {
      console.error('Error in fetchTasks:', err);
      setError(`タスクの取得に失敗しました。${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // タスクリストの選択
  const selectTaskList = (taskListId) => {
    setSelectedTaskList(taskListId);
  };

  // コンテキストの値
  const value = {
    todos,
    taskLists,
    selectedTaskList,
    loading,
    error,
    fetchTasks,
    fetchTaskLists,
    selectTaskList
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
