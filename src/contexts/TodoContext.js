import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import TasksService from '../services/tasksService';
import { requestTasksScope } from '../services/authService';
import { isToday, isTomorrow, addDays, isBefore, parseISO, startOfDay } from 'date-fns';

const TodoContext = createContext();

export const TodoProvider = ({ children }) => {
  const [todos, setTodos] = useState([]);
  const [filteredTodos, setFilteredTodos] = useState([]);
  const [taskLists, setTaskLists] = useState([]);
  const [selectedTaskList, setSelectedTaskList] = useState('@default');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showCompleted, setShowCompleted] = useState(true);
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
      setFilteredTodos([]);
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

  // フィルターが変更されたときにタスクをフィルタリング
  useEffect(() => {
    filterTodos();
  }, [todos, selectedFilter, showCompleted]);

  // タスクのフィルタリング
  const filterTodos = () => {
    if (!todos.length) {
      setFilteredTodos([]);
      return;
    }

    let filtered = [...todos];
    
    // 完了タスクのフィルタリング
    if (!showCompleted) {
      filtered = filtered.filter(todo => todo.status !== 'completed');
    }
    
    // 日付フィルターの適用
    switch (selectedFilter) {
      case 'today':
        filtered = filtered.filter(todo => {
          if (!todo.startDate) return false;
          try {
            const date = parseISO(todo.startDate);
            return isToday(date);
          } catch (e) {
            return false;
          }
        });
        break;
      case 'tomorrow':
        filtered = filtered.filter(todo => {
          if (!todo.startDate) return false;
          try {
            const date = parseISO(todo.startDate);
            return isTomorrow(date);
          } catch (e) {
            return false;
          }
        });
        break;
      case 'after-tomorrow':
        filtered = filtered.filter(todo => {
          if (!todo.startDate) return false;
          try {
            const date = parseISO(todo.startDate);
            const afterTomorrow = addDays(new Date(), 2);
            return date.getDate() === afterTomorrow.getDate() &&
                   date.getMonth() === afterTomorrow.getMonth() &&
                   date.getFullYear() === afterTomorrow.getFullYear();
          } catch (e) {
            return false;
          }
        });
        break;
      case 'past':
        filtered = filtered.filter(todo => {
          if (!todo.startDate) return false;
          try {
            const date = parseISO(todo.startDate);
            return isBefore(date, startOfDay(new Date()));
          } catch (e) {
            return false;
          }
        });
        break;
      case 'all':
      default:
        // すべてのタスクを表示（フィルタリングなし）
        break;
    }
    
    setFilteredTodos(filtered);
  };

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

  // 新しいタスクを作成
  const createTask = async (taskData, listId = selectedTaskList) => {
    try {
      setLoading(true);
      setError(null);
      
      const newTask = await TasksService.createTask(listId, taskData);
      console.log('Created new task:', newTask);
      
      // タスクリストを再取得
      fetchTasks(listId);
      
      return newTask;
    } catch (err) {
      console.error('Failed to create task:', err);
      setError(`タスクの作成に失敗しました。${err.message}`);
      setLoading(false);
      throw err;
    }
  };

  // タスクリストの選択
  const selectTaskList = (taskListId) => {
    setSelectedTaskList(taskListId);
  };

  // フィルターの選択
  const selectFilter = (filterId) => {
    setSelectedFilter(filterId);
  };

  // 完了タスクの表示/非表示を切り替え
  const toggleShowCompleted = () => {
    setShowCompleted(prev => !prev);
  };

  // タスクリストのタイトル更新
  const updateTaskListTitle = async (taskListId, newTitle) => {
    try {
      setLoading(true);
      // 実際のAPIを呼び出す前に、UIを先に更新（オプティミスティックUI更新）
      setTaskLists(prevLists => 
        prevLists.map(list => 
          list.id === taskListId ? { ...list, title: newTitle } : list
        )
      );
      
      // APIを呼び出してタスクリストのタイトルを更新する
      await TasksService.updateTaskList(taskListId, { title: newTitle });
      
      // 成功した場合は何もしない（すでに更新済み）
      console.log(`Task list ${taskListId} title updated to: ${newTitle}`);
    } catch (err) {
      console.error('Failed to update task list title:', err);
      setError(`タスクリストの更新に失敗しました。${err.message}`);
      
      // 失敗した場合は元に戻す
      fetchTaskLists();
    } finally {
      setLoading(false);
    }
  };

  // タスクを別のリストに移動
  const moveTaskToList = async (taskId, targetListId) => {
    try {
      // 移動するタスクを見つける
      const taskToMove = todos.find(task => task.id === taskId);
      if (!taskToMove) return;
      
      // 現在のリストからタスクを削除
      setTodos(prevTodos => prevTodos.filter(task => task.id !== taskId));
      
      // APIを呼び出してタスクを移動する
      await TasksService.moveTask(taskId, selectedTaskList, targetListId);
      
      // 移動先のリストが現在表示中のリストなら、タスクを再取得
      if (targetListId === selectedTaskList) {
        fetchTasks(targetListId);
      }
      
      console.log(`Task ${taskId} moved to list: ${targetListId}`);
    } catch (err) {
      console.error('Failed to move task:', err);
      setError(`タスクの移動に失敗しました。${err.message}`);
      
      // 失敗した場合は元のリストのタスクを再取得
      fetchTasks(selectedTaskList);
    }
  };

  // コンテキストの値
  const value = {
    todos: filteredTodos,
    allTodos: todos,
    taskLists,
    selectedTaskList,
    selectedFilter,
    showCompleted,
    loading,
    error,
    fetchTasks,
    fetchTaskLists,
    createTask,
    selectTaskList,
    selectFilter,
    toggleShowCompleted,
    updateTaskListTitle,
    moveTaskToList
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
