import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import TasksService from '../services/tasksService';
import { extractStarredStatus } from '../services/tasksUtils';
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
      // 直接タスクリストを取得
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

  // フィルターが変更されたときにタスクを取得またはフィルタリング
  useEffect(() => {
    if (isAuthenticated) {
      if (selectedFilter !== 'all' && selectedFilter) {
        console.log(`Filter changed to: ${selectedFilter}, fetching all tasks`);
        fetchAllTasks();
      } else if (selectedTaskList) {
        console.log(`Filter changed to: all, fetching tasks for list: ${selectedTaskList}`);
        fetchTasks(selectedTaskList);
      }
    }
  }, [isAuthenticated, selectedFilter]);

  // タスクが更新されたときにフィルタリング
  useEffect(() => {
    console.log('Filtering todos based on updated data');
    filterTodos();
  }, [todos, showCompleted]);

  // タスクのフィルタリング
  const filterTodos = (todosToFilter = todos) => {
    if (!todosToFilter || !todosToFilter.length) {
      console.log('No todos to filter');
      setFilteredTodos([]);
      return;
    }

    console.log(`Filtering ${todosToFilter.length} todos with filter: ${selectedFilter}`);
    
    // デバッグ用：フィルタリング前のタスクの順序を確認
    console.log('Tasks before filtering:', todosToFilter.map(task => ({
      title: task.title,
      position: task.position
    })));
    
    let filtered = [...todosToFilter];
    
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
            // 今週（日曜日から土曜日まで）のタスクを表示
            const date = parseISO(todo.startDate);
            const today = new Date();
            const startOfWeek = startOfDay(new Date(today));
            // 今日の曜日を取得（0: 日曜日, 1: 月曜日, ..., 6: 土曜日）
            const dayOfWeek = today.getDay();
            // 日曜日まで戻る
            startOfWeek.setDate(today.getDate() - dayOfWeek);
            
            // 週の終わり（土曜日）
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            
            // タスクの日付が今週の範囲内かチェック
            return date >= startOfWeek && date <= endOfWeek;
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
      case 'starred':
        // スター付きのタスクをフィルタリング
        filtered = filtered.filter(todo => todo.starred === true);
        break;
      case 'all':
      default:
        // すべてのタスクを表示（フィルタリングなし）
        break;
    }
    
    // デバッグ用：フィルタリング後のタスクの順序を確認
    console.log('Tasks after filtering:', filtered.map(task => ({
      title: task.title,
      position: task.position
    })));
    
    setFilteredTodos(filtered);
  };

  // タスクリストの取得
  const fetchTaskLists = async () => {
    try {
      console.log('Starting fetchTaskLists');
      setLoading(true);
      setError(null);
      
      try {
        // アクセストークンの確認
        const token = localStorage.getItem('google_access_token');
        if (!token) {
          console.error('No access token available');
          setError('認証情報が見つかりません。再度ログインしてください。');
          setLoading(false);
          return;
        }
        
        // 直接fetchを使用してタスクリストを取得
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };
        
        const response = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
          headers,
          cache: 'no-store'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // 認証エラーの場合は再認証を要求
            console.error('Authentication error, requesting new token');
            requestTasksScope();
            return;
          }
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        const lists = data.items || [];
        console.log('Received task lists:', lists);
        setTaskLists(lists);
        
        // デフォルトのタスクリストを選択
        if (lists && lists.length > 0) {
          const defaultList = lists.find(list => list.title === 'マイタスク') || lists[0];
          setSelectedTaskList(defaultList.id);
          
          // 選択したリストのタスクを取得
          await fetchTasks(defaultList.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch task lists:', err);
        
        // スコープ不足エラーの場合、明示的なスコープ承認を要求
        if (err.message && err.message.includes('insufficient authentication scopes') || 
            err.message && err.message.includes('API error: 401')) {
          console.log('Insufficient scopes detected, requesting explicit authorization');
          requestTasksScope();
          return;
        } else {
          setError(`タスクリストの取得に失敗しました。${err.message}`);
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Error in fetchTaskLists:', err);
      setError(`タスクリストの取得に失敗しました。${err.message}`);
      setLoading(false);
    }
  };

  // タスクリストの取得
  const fetchTasks = async (taskListId = selectedTaskList) => {
    try {
      console.log(`Starting fetchTasks for list: ${taskListId}`);
      setLoading(true);
      setError(null);
      
      if (!taskListId) {
        console.error('No task list ID provided');
        setError('タスクリストが選択されていません。');
        setLoading(false);
        return;
      }
      
      try {
        // アクセストークンの確認
        const token = localStorage.getItem('google_access_token');
        if (!token) {
          console.error('No access token available');
          setError('認証情報が見つかりません。再度ログインしてください。');
          setLoading(false);
          return;
        }
        
        // 直接fetchを使用してタスクを取得
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };
        
        const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks?showCompleted=true&showHidden=true&maxResults=100`;
        console.log('Request URL:', url);
        
        const response = await fetch(url, {
          headers,
          cache: 'no-store'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // 認証エラーの場合は再認証を要求
            console.error('Authentication error, requesting new token');
            requestTasksScope();
            return;
          }
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response Data:', data);
        
        // 日付フィールドの処理
        const tasks = data.items || [];
        const tasksWithListId = tasks.map(task => {
          // Google Tasks APIのレスポンスを確認
          console.log('Raw task data:', task);
          
          // スター状態を抽出
          const isStarred = extractStarredStatus(task);
          console.log(`Task ${task.title} starred status:`, isStarred);
          
          return {
            ...task,
            listId: taskListId, // 明示的にlistIdを設定
            startDate: task.due, // dueフィールドをstartDateとして使用
            starred: isStarred // 抽出したスター状態を設定
          };
        });
        
        // タスクをposition順にソート
        const sortedTasks = [...tasksWithListId].sort((a, b) => {
          // positionが文字列の場合は数値に変換
          const posA = typeof a.position === 'string' ? parseFloat(a.position) : a.position;
          const posB = typeof b.position === 'string' ? parseFloat(b.position) : b.position;
          return posA - posB;
        });
        
        // デバッグ用：タスクの順序を確認
        console.log('Tasks before setting to state:', sortedTasks.map(task => ({
          title: task.title,
          position: task.position
        })));
        
        setTodos(sortedTasks);
        // タスクを取得した後、フィルタリングを実行
        filterTodos(sortedTasks);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        
        // スコープ不足エラーの場合、明示的なスコープ承認を要求
        if (err.message && err.message.includes('insufficient authentication scopes') || 
            err.message && err.message.includes('API error: 401')) {
          console.log('Insufficient scopes detected, requesting explicit authorization');
          requestTasksScope();
          return;
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

  // すべてのタスクリストからタスクを取得
  const fetchAllTasks = async () => {
    try {
      console.log('Fetching tasks from all lists');
      setLoading(true);
      setError(null);
      
      // アクセストークンの確認
      const token = localStorage.getItem('google_access_token');
      if (!token) {
        console.error('No access token available');
        setError('認証情報が見つかりません。再度ログインしてください。');
        setLoading(false);
        return;
      }
      
      // すべてのタスクリストを取得
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      
      const listsResponse = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        headers,
        cache: 'no-store'
      });
      
      if (!listsResponse.ok) {
        if (listsResponse.status === 401) {
          // 認証エラーの場合は再認証を要求
          console.error('Authentication error, requesting new token');
          requestTasksScope();
          return;
        }
        throw new Error(`API error: ${listsResponse.status}`);
      }
      
      const listsData = await listsResponse.json();
      const lists = listsData.items || [];
      console.log('Received all task lists:', lists);
      
      if (!lists || lists.length === 0) {
        console.log('No task lists found');
        setTodos([]);
        setFilteredTodos([]);
        setLoading(false);
        return;
      }
      
      // すべてのタスクリストからタスクを取得
      let allTasks = [];
      for (const list of lists) {
        try {
          const url = `https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks?showCompleted=true&showHidden=true&maxResults=100`;
          const taskResponse = await fetch(url, {
            headers,
            cache: 'no-store'
          });
          
          if (!taskResponse.ok) {
            console.error(`Failed to fetch tasks from list ${list.id}: ${taskResponse.status}`);
            continue;
          }
          
          const taskData = await taskResponse.json();
          const tasks = taskData.items || [];
          
          // タスクにlistIdを追加
          const tasksWithListId = tasks.map(task => {
            // Google Tasks APIのレスポンスを確認
            console.log('Raw task data from all lists:', task);
            
            // スター状態を抽出
            const isStarred = extractStarredStatus(task);
            console.log(`Task ${task.title} starred status:`, isStarred);
            
            return {
              ...task,
              listId: list.id,
              startDate: task.due, // dueフィールドをstartDateとして使用
              starred: isStarred // 抽出したスター状態を設定
            };
          });
          
          allTasks = [...allTasks, ...tasksWithListId];
        } catch (err) {
          console.error(`Failed to fetch tasks from list ${list.id}:`, err);
        }
      }
      
      // タスクをposition順にソート
      const sortedTasks = [...allTasks].sort((a, b) => {
        // positionが文字列の場合は数値に変換
        const posA = typeof a.position === 'string' ? parseFloat(a.position) : a.position;
        const posB = typeof b.position === 'string' ? parseFloat(b.position) : b.position;
        return posA - posB;
      });
      
      console.log('All tasks from all lists:', sortedTasks);
      setTodos(sortedTasks);
      // タスクを取得した後、フィルタリングを実行
      filterTodos(sortedTasks);
    } catch (err) {
      console.error('Error in fetchAllTasks:', err);
      setError(`すべてのタスクの取得に失敗しました。${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 新しいタスクを作成
  const createTask = async (taskData, listId = selectedTaskList) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Creating new task in list ${listId} with data:`, taskData);
      
      const newTask = await TasksService.createTask(listId, taskData);
      console.log('Created new task:', newTask);
      
      // タスクリストを再取得して最新の状態を反映
      if (selectedFilter !== 'all') {
        fetchAllTasks();
      } else if (selectedTaskList) {
        fetchTasks(selectedTaskList);
      } else {
        fetchAllTasks();
      }
      
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
    console.log(`Selecting task list: ${taskListId}`);
    setSelectedTaskList(taskListId);
    setSelectedFilter('all'); // フィルターをリセット
    
    // 選択されたタスクリストのタスクを取得
    if (taskListId) {
      fetchTasks(taskListId);
    }
  };

  // フィルターの選択
  const selectFilter = (filterId) => {
    console.log(`Selecting filter: ${filterId}`);
    setSelectedFilter(filterId);
    
    // フィルターが選択された場合の処理
    if (filterId === 'all') {
      // 'all'フィルターの場合は、タスクリスト選択をクリア
      setSelectedTaskList(null);
      // すべてのタスクを取得
      fetchAllTasks();
    } else {
      // その他のフィルターの場合も、タスクリスト選択をクリア
      setSelectedTaskList(null);
      // すべてのタスクリストからタスクを取得してフィルタリング
      fetchAllTasks();
    }
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

  // タスクを削除
  const deleteTask = async (taskId) => {
    try {
      setLoading(true);
      setError(null);
      
      // タスクを見つける
      const taskToDelete = todos.find(task => task.id === taskId);
      if (!taskToDelete) {
        throw new Error('タスクが見つかりません。');
      }
      
      // タスクのリストIDを取得
      const listId = taskToDelete.listId;
      if (!listId) {
        throw new Error('タスクリストが見つかりません。');
      }
      
      // 実際のAPIを呼び出す前に、UIを先に更新（オプティミスティックUI更新）
      setTodos(prevTodos => prevTodos.filter(task => task.id !== taskId));
      
      // APIを呼び出してタスクを削除する
      await TasksService.deleteTask(listId, taskId);
      
      console.log(`Task ${taskId} deleted successfully`);
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError(`タスクの削除に失敗しました。${err.message}`);
      
      // 失敗した場合は元に戻す
      if (selectedFilter !== 'all') {
        fetchAllTasks();
      } else if (selectedTaskList) {
        fetchTasks(selectedTaskList);
      } else {
        fetchAllTasks();
      }
    } finally {
      setLoading(false);
    }
  };

  // タスクの完了状態を切り替える
  const toggleTaskCompletion = async (taskId, currentStatus) => {
    try {
      setLoading(true);
      setError(null);
      
      // タスクを見つける
      const taskToUpdate = todos.find(task => task.id === taskId);
      if (!taskToUpdate) {
        throw new Error('タスクが見つかりません。');
      }
      
      // タスクのリストIDを取得
      const listId = taskToUpdate.listId;
      if (!listId) {
        throw new Error('タスクリストが見つかりません。');
      }
      
      // 現在の状態の反対に切り替える
      const newStatus = currentStatus === 'completed' ? 'needsAction' : 'completed';
      
      // 実際のAPIを呼び出す前に、UIを先に更新（オプティミスティックUI更新）
      setTodos(prevTodos => 
        prevTodos.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
      
      // APIを呼び出してタスクのステータスを更新する
      await TasksService.updateTaskStatus(listId, taskId, newStatus);
      
      console.log(`Task ${taskId} status updated to: ${newStatus}`);
    } catch (err) {
      console.error('Failed to update task status:', err);
      setError(`タスクの状態更新に失敗しました。${err.message}`);
      
      // 失敗した場合は元に戻す
      if (selectedFilter !== 'all') {
        fetchAllTasks();
      } else if (selectedTaskList) {
        fetchTasks(selectedTaskList);
      } else {
        fetchAllTasks();
      }
    } finally {
      setLoading(false);
    }
  };
  
  // タスクリストの並び替え
  const reorderTaskLists = async (newTaskLists) => {
    try {
      setLoading(true);
      
      // UIを先に更新（オプティミスティックUI更新）
      setTaskLists(newTaskLists);
      
      // ここでAPIを呼び出してサーバー側でも並び替えを保存する
      // Google Tasks APIには直接的なリスト並び替え機能がないため、
      // フロントエンドでの表示順序のみを管理する
      
      console.log('Task lists reordered');
    } catch (err) {
      console.error('Failed to reorder task lists:', err);
      setError(`タスクリストの並び替えに失敗しました。${err.message}`);
      
      // 失敗した場合は元に戻す
      fetchTaskLists();
    } finally {
      setLoading(false);
    }
  };

  // タスクを更新
  const updateTask = async (taskId, taskData) => {
    try {
      setLoading(true);
      setError(null);
      
      // タスクを見つける
      const taskToUpdate = todos.find(task => task.id === taskId);
      if (!taskToUpdate) {
        throw new Error('タスクが見つかりません。');
      }
      
      // タスクのリストIDを取得
      const listId = taskToUpdate.listId;
      if (!listId) {
        throw new Error('タスクリストが見つかりません。');
      }
      
      // 実際のAPIを呼び出す前に、UIを先に更新（オプティミスティックUI更新）
      setTodos(prevTodos => 
        prevTodos.map(task => 
          task.id === taskId ? { 
            ...task, 
            title: taskData.title,
            description: taskData.notes,
            startDate: taskData.due,
            starred: taskData.starred,
            priority: taskData.priority // 優先度も明示的に更新
          } : task
        )
      );
      
      console.log(`Updating task ${taskId} with data:`, taskData);
      
      // APIを呼び出してタスクを更新する
      const updatedTask = await TasksService.updateTask(listId, taskId, taskData);
      console.log(`Task ${taskId} updated successfully:`, updatedTask);
      
      // 更新後のタスクを再取得して状態を最新に保つ
      if (selectedFilter !== 'all') {
        fetchAllTasks();
      } else if (selectedTaskList) {
        fetchTasks(selectedTaskList);
      } else {
        fetchAllTasks();
      }
    } catch (err) {
      console.error('Failed to update task:', err);
      setError(`タスクの更新に失敗しました。${err.message}`);
      
      // 失敗した場合は元に戻す
      if (selectedFilter !== 'all') {
        fetchAllTasks();
      } else if (selectedTaskList) {
        fetchTasks(selectedTaskList);
      } else {
        fetchAllTasks();
      }
    } finally {
      setLoading(false);
    }
  };
  
  // タスクリストを削除
  const deleteTaskList = async (listId) => {
    try {
      setLoading(true);
      setError(null);
      
      // 実際のAPIを呼び出す前に、UIを先に更新（オプティミスティックUI更新）
      setTaskLists(prevLists => prevLists.filter(list => list.id !== listId));
      
      // 削除するリストが現在選択されているリストの場合は、デフォルトリストに切り替える
      if (selectedTaskList === listId) {
        // 最初のリストか、なければ 'all' フィルターに切り替え
        const firstList = taskLists.find(list => list.id !== listId);
        if (firstList) {
          selectTaskList(firstList.id);
        } else {
          selectFilter('all');
        }
      }
      
      // APIを呼び出してタスクリストを削除する
      await TasksService.deleteTaskList(listId);
      
      console.log(`Task list ${listId} deleted successfully`);
    } catch (err) {
      console.error('Failed to delete task list:', err);
      setError(`タスクリストの削除に失敗しました。${err.message}`);
      
      // 失敗した場合は元に戻す
      fetchTaskLists();
    } finally {
      setLoading(false);
    }
  };
  
  // 新しいタスクリストを作成
  const createTaskList = async (title) => {
    try {
      setLoading(true);
      setError(null);
      
      const newList = await TasksService.createTaskList(title);
      console.log('Created new task list:', newList);
      
      // タスクリストを再取得
      fetchTaskLists();
      
      return newList;
    } catch (err) {
      console.error('Failed to create task list:', err);
      setError(`タスクリストの作成に失敗しました。${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // タスクの順序を更新
  const reorderTasks = async (newTasks) => {
    try {
      setLoading(true);
      
      // タスクをposition順にソート
      const sortedTasks = [...newTasks].sort((a, b) => {
        // positionが文字列の場合は数値に変換
        const posA = typeof a.position === 'string' ? parseFloat(a.position) : a.position;
        const posB = typeof b.position === 'string' ? parseFloat(b.position) : b.position;
        return posA - posB;
      });
      
      // UIを先に更新（オプティミスティックUI更新）
      setTodos(sortedTasks);
      
      // Google Tasks APIに順序変更を反映
      // Google Tasks APIでは、タスクの順序はprevious/parentパラメータで指定します
      for (let i = 0; i < sortedTasks.length; i++) {
        const task = sortedTasks[i];
        const previousTask = i > 0 ? sortedTasks[i - 1] : null;
        
        try {
          await TasksService.moveTaskInList(
            selectedTaskList,
            task.id,
            previousTask ? previousTask.id : null
          );
        } catch (moveErr) {
          console.error(`Failed to move task ${task.id}:`, moveErr);
          // 個別のタスク移動エラーは無視して続行
        }
      }
      
      // 変更後にタスクを再取得して最新の順序を反映
      await fetchTasks(selectedTaskList);
      
      console.log('Tasks reordered and synced with Google Tasks');
    } catch (err) {
      console.error('Failed to reorder tasks:', err);
      setError(`タスクの並び替えに失敗しました。${err.message}`);
      
      // 失敗した場合は元に戻す
      fetchTasks(selectedTaskList);
    } finally {
      setLoading(false);
    }
  };

  // 検索クエリに基づいてタスクをフィルタリング
  const searchTasks = (query) => {
    if (!query || query.trim() === '') {
      // 検索クエリが空の場合は通常のフィルタリングを適用
      filterTodos();
      return;
    }
    
    // 検索クエリを小文字に変換
    const lowerQuery = query.toLowerCase();
    
    // すべてのタスクから検索クエリに一致するものをフィルタリング
    const searchResults = todos.filter(todo => {
      // タイトルで検索
      if (todo.title && todo.title.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      
      // 説明（notes）で検索
      if (todo.notes && todo.notes.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      
      return false;
    });
    
    // 完了タスクのフィルタリング
    if (!showCompleted) {
      const filteredResults = searchResults.filter(todo => todo.status !== 'completed');
      setFilteredTodos(filteredResults);
    } else {
      setFilteredTodos(searchResults);
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
    deleteTask,
    selectTaskList,
    selectFilter,
    toggleShowCompleted,
    updateTaskListTitle,
    moveTaskToList,
    toggleTaskCompletion,
    reorderTaskLists,
    updateTask,
    reorderTasks,
    createTaskList,
    deleteTaskList,
    searchTasks
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
