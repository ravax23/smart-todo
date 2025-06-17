import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import TasksService from '../services/tasksService';
import syncService from '../services/syncService';
import { extractStarredStatus } from '../services/tasksUtils';
import { requestTasksScope } from '../services/authService';
import { isToday, isTomorrow, addDays, isBefore, parseISO, startOfDay, isThisWeek } from 'date-fns';

const TodoContext = createContext();

export const TodoProvider = ({ children }) => {
  const [todos, setTodos] = useState([]);
  const [filteredTodos, setFilteredTodos] = useState([]);
  const [taskLists, setTaskLists] = useState([]);
  const [selectedTaskList, setSelectedTaskList] = useState('@default');
  const [selectedFilter, setSelectedFilter] = useState('today'); // 初期表示を「今日」に変更
  const [showCompleted, setShowCompleted] = useState(false); // デフォルトで完了タスクを非表示に変更
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState({ isSyncing: false, lastSyncTime: null });
  const { isAuthenticated } = useAuth();

  // 共通のフィルタリングとソート処理
  const applyFilterAndSort = (tasksToProcess = todos) => {
    console.log('[DEBUG] applyFilterAndSort called - 共通フィルタリングとソート処理開始');
    
    if (!tasksToProcess || tasksToProcess.length === 0) {
      console.log('[DEBUG] No tasks to process');
      setFilteredTodos([]);
      return [];
    }
    
    // 完了タスクのフィルタリング
    let filtered = showCompleted ? tasksToProcess : tasksToProcess.filter(todo => todo.status !== 'completed');
    
    // フィルターまたはタスクリストでフィルタリング
    if (selectedFilter) {
      // フィルターが選択されている場合
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
              const today = new Date();
              const startOfWeek = startOfDay(new Date(today));
              const dayOfWeek = today.getDay();
              startOfWeek.setDate(today.getDate() - dayOfWeek);
              
              const endOfWeek = new Date(startOfWeek);
              endOfWeek.setDate(startOfWeek.getDate() + 6);
              
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
          filtered = filtered.filter(todo => todo.starred === true);
          break;
        case 'all':
          // すべてのタスクを表示（フィルタリングなし）
          break;
      }
    } else if (selectedTaskList && selectedTaskList !== '@default' && selectedTaskList !== 'all') {
      // タスクリストが選択されている場合
      filtered = filtered.filter(todo => todo.listId === selectedTaskList);
    }
    
    console.log(`[DEBUG] フィルタリング後のタスク数: ${filtered.length}`);
    
    // ソート処理を適用
    const sortedTasks = sortTasks(filtered);
    
    console.log('[DEBUG] ソート後のタスク:', sortedTasks.map(task => ({
      id: task.id.substring(0, 8),
      title: task.title,
      position: task.position,
      startDate: task.startDate
    })));
    
    // 結果を状態に設定
    setFilteredTodos(sortedTasks);
    
    return sortedTasks;
  };

  // 初期データの読み込み
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User is authenticated, fetching task lists');
      // 初期同期を実行
      initialSync();
      // 定期的な同期を開始（5分間隔）
      syncService.startPeriodicSync(300000);
    }
    
    // コンポーネントのアンマウント時に定期同期を停止
    return () => {
      syncService.stopPeriodicSync();
    };
  }, [isAuthenticated]);

  // 初期同期処理
  const initialSync = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // タスクリストを取得
      const lists = await TasksService.getTaskLists();
      console.log('Fetched task lists:', lists);
      setTaskLists(lists);
      
      // タスクを取得
      const allTasks = await TasksService.getAllTasks(lists);
      console.log(`Fetched ${allTasks.length} tasks`);
      
      // スター状態を抽出
      const tasksWithStarred = allTasks.map(task => ({
        ...task,
        starred: extractStarredStatus(task)
      }));
      
      // タスクを設定
      setTodos(tasksWithStarred);
      
      // 同期状態を更新
      updateSyncStatus();
      
      // フィルタリングを適用
      applyFilterAndSort(tasksWithStarred);
    } catch (err) {
      console.error('Initial sync failed:', err);
      
      if (err.message === 'Insufficient permissions') {
        // 権限不足の場合は追加の権限をリクエスト
        try {
          await requestTasksScope();
        } catch (authErr) {
          console.error('Failed to request additional permissions:', authErr);
          setError('タスクへのアクセス権限が不足しています。再ログインして権限を許可してください。');
        }
      } else {
        setError(`初期同期に失敗しました。${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 同期状態の更新
  const updateSyncStatus = () => {
    const status = syncService.getSyncStatus();
    setSyncStatus({
      isSyncing: status.isSyncing,
      lastSyncTime: status.lastSyncTime,
      queueLength: status.queueLength,
      pendingChanges: status.pendingChanges
    });
  };

  // タスクリストが選択されたときにタスクをフィルタリング
  useEffect(() => {
    if (isAuthenticated && selectedTaskList) {
      console.log(`Selected task list changed to: ${selectedTaskList}`);
      applyFilterAndSort();
    }
  }, [isAuthenticated, selectedTaskList, todos]);

  // フィルターが変更されたときにタスクをフィルタリング
  useEffect(() => {
    if (isAuthenticated) {
      console.log(`Filter changed to: ${selectedFilter}`);
      applyFilterAndSort();
    }
  }, [isAuthenticated, selectedFilter, todos]);

  // タスクが更新されたときにフィルタリング
  useEffect(() => {
    console.log('Filtering todos based on updated data');
    applyFilterAndSort();
  }, [todos, showCompleted]);

  // タスクを指定された順序で並び替える関数
  const sortTasks = (tasks) => {
    console.log('[DEBUG] sortTasks called - タスクのソート開始');
    
    if (!tasks || tasks.length === 0) {
      return [];
    }
    
    return [...tasks].sort((a, b) => {
      // 1. 期限順（昇順、なしは最後）
      if (a.startDate !== b.startDate) {
        // 期限なしのタスクは最後に配置
        if (!a.startDate) return 1;
        if (!b.startDate) return -1;
        
        try {
          const dateA = parseISO(a.startDate);
          const dateB = parseISO(b.startDate);
          console.log(`[DEBUG] 日付比較: ${a.title} (${a.startDate}) vs ${b.title} (${b.startDate}) = ${dateA - dateB}`);
          return dateA - dateB;
        } catch (e) {
          // 日付の解析に失敗した場合はマイリスト順で並べる
          console.error('[DEBUG] Date parsing error:', e);
        }
      }
      
      // 2. マイリスト順（taskListsの順序に基づく）
      if (a.listId !== b.listId) {
        const listA = taskLists.findIndex(list => list.id === a.listId);
        const listB = taskLists.findIndex(list => list.id === b.listId);
        // findIndexが-1を返す場合（リストが見つからない場合）は最後に配置
        const indexA = listA === -1 ? Number.MAX_SAFE_INTEGER : listA;
        const indexB = listB === -1 ? Number.MAX_SAFE_INTEGER : listB;
        console.log(`[DEBUG] リスト比較: ${a.title} (listIdx: ${indexA}) vs ${b.title} (listIdx: ${indexB}) = ${indexA - indexB}`);
        return indexA - indexB;
      }
      
      // 3. position順（同じ日付、同じリストの場合）
      // positionが存在しない場合は0として扱う
      const posA = a.position ? (typeof a.position === 'string' ? parseFloat(a.position) : a.position) : 0;
      const posB = b.position ? (typeof b.position === 'string' ? parseFloat(b.position) : b.position) : 0;
      
      console.log(`[DEBUG] Position比較: ${a.title} (pos: ${posA}) vs ${b.title} (pos: ${posB}) = ${posA - posB}`);
      
      return posA - posB;
    });
  };

  // 手動同期を実行
  const manualSync = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 同期キューに残っているタスクを処理
      await syncService.startSync();
      
      // 同期状態を更新
      updateSyncStatus();
      
      // 初期同期を再実行して最新データを取得
      await initialSync();
    } catch (err) {
      console.error('Manual sync failed:', err);
      setError(`手動同期に失敗しました。${err.message}`);
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
      
      // 新しいタスクのIDを生成（一時的なID）
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 新しいタスクオブジェクトを作成
      const newTask = {
        id: tempId,
        title: taskData.title,
        notes: taskData.notes || '',
        due: taskData.due,
        status: 'needsAction',
        starred: taskData.starred,
        listId: listId,
        position: `${Date.now()}`, // 一時的なposition値
        startDate: taskData.due // dueフィールドをstartDateとして使用
      };
      
      // メモリ内のタスクリストに追加
      const updatedTodos = [...todos, newTask];
      setTodos(updatedTodos);
      
      // 同期キューに追加
      syncService.addToSyncQueue('task', 'create', {
        ...newTask,
        listId: listId
      });
      
      // 同期状態を更新
      updateSyncStatus();
      
      // フィルタリングとソートを適用
      applyFilterAndSort(updatedTodos);
      
      return newTask;
    } catch (err) {
      console.error('Failed to create task:', err);
      setError(`タスクの作成に失敗しました。${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // タスクリストの選択
  const selectTaskList = (taskListId) => {
    console.log(`Selecting task list: ${taskListId}`);
    setSelectedTaskList(taskListId);
    setSelectedFilter(null); // フィルターをリセット
  };

  // フィルターの選択
  const selectFilter = (filterId) => {
    console.log(`Selecting filter: ${filterId}`);
    setSelectedFilter(filterId);
    // フィルター選択時はタスクリストの選択をクリアしない
  };

  // 完了タスクの表示/非表示を切り替え
  const toggleShowCompleted = () => {
    setShowCompleted(prev => !prev);
  };

  // タスクリストのタイトル更新
  const updateTaskListTitle = async (taskListId, newTitle) => {
    try {
      setLoading(true);
      
      // メモリ内のタスクリストを更新
      const updatedLists = taskLists.map(list => 
        list.id === taskListId ? { ...list, title: newTitle } : list
      );
      setTaskLists(updatedLists);
      
      // 同期キューに追加
      syncService.addToSyncQueue('taskList', 'update', {
        id: taskListId,
        title: newTitle
      });
      
      // 同期状態を更新
      updateSyncStatus();
      
      // フィルタリングとソートを再適用
      applyFilterAndSort();
      
      console.log(`Task list ${taskListId} title updated to: ${newTitle}`);
    } catch (err) {
      console.error('Failed to update task list title:', err);
      setError(`タスクリストの更新に失敗しました。${err.message}`);
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
      
      const sourceListId = taskToMove.listId;
      
      // メモリ内のタスクを更新
      const updatedTodos = todos.map(task => 
        task.id === taskId ? { ...task, listId: targetListId } : task
      );
      setTodos(updatedTodos);
      
      // 同期キューに追加
      syncService.addToSyncQueue('task', 'update', {
        id: taskId,
        listId: sourceListId,
        newListId: targetListId
      });
      
      // 同期状態を更新
      updateSyncStatus();
      
      // フィルタリングとソートを再適用
      applyFilterAndSort(updatedTodos);
      
      console.log(`Task ${taskId} moved to list: ${targetListId}`);
    } catch (err) {
      console.error('Failed to move task:', err);
      setError(`タスクの移動に失敗しました。${err.message}`);
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
      
      // メモリ内のタスクを削除
      const updatedTodos = todos.filter(task => task.id !== taskId);
      setTodos(updatedTodos);
      
      // 同期キューに追加
      syncService.addToSyncQueue('task', 'delete', {
        id: taskId,
        listId: listId
      });
      
      // 同期状態を更新
      updateSyncStatus();
      
      // フィルタリングとソートを再適用
      applyFilterAndSort(updatedTodos);
      
      console.log(`Task ${taskId} deleted successfully`);
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError(`タスクの削除に失敗しました。${err.message}`);
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
      
      // メモリ内のタスクを更新
      const updatedTodos = todos.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      setTodos(updatedTodos);
      
      // 同期キューに追加
      syncService.addToSyncQueue('task', 'update', {
        id: taskId,
        listId: listId,
        status: newStatus,
        completed: newStatus === 'completed' ? new Date().toISOString() : null
      });
      
      // 同期状態を更新
      updateSyncStatus();
      
      // フィルタリングとソートを再適用
      applyFilterAndSort(updatedTodos);
      
      console.log(`Task ${taskId} status updated to: ${newStatus}`);
    } catch (err) {
      console.error('Failed to update task status:', err);
      setError(`タスクの状態更新に失敗しました。${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // タスクリストの並び替え
  const reorderTaskLists = async (newTaskLists) => {
    try {
      setLoading(true);
      
      // メモリ内のタスクリストを更新
      setTaskLists(newTaskLists);
      
      // フィルタリングとソートを再適用
      applyFilterAndSort();
      
      console.log('Task lists reordered');
    } catch (err) {
      console.error('Failed to reorder task lists:', err);
      setError(`タスクリストの並び替えに失敗しました。${err.message}`);
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
      
      console.log(`[DEBUG] 更新前のタスク:`, {
        id: taskToUpdate.id,
        title: taskToUpdate.title,
        position: taskToUpdate.position,
        startDate: taskToUpdate.startDate
      });
      
      // メモリ内のタスクを更新
      const updatedTodos = todos.map(task => 
        task.id === taskId ? { 
          ...task, 
          title: taskData.title,
          notes: taskData.notes || '',
          startDate: taskData.due,
          due: taskData.due,
          starred: taskData.starred,
          // positionは更新しない（元の値を保持）
        } : task
      );
      
      // 更新後のタスクをログ出力
      const updatedTask = updatedTodos.find(task => task.id === taskId);
      console.log(`[DEBUG] 更新後のタスク:`, {
        id: updatedTask.id,
        title: updatedTask.title,
        position: updatedTask.position,
        startDate: updatedTask.startDate
      });
      
      // 状態を更新
      setTodos(updatedTodos);
      
      console.log(`Updating task ${taskId} with data:`, taskData);
      
      // 同期キューに追加
      syncService.addToSyncQueue('task', 'update', {
        id: taskId,
        listId: listId,
        title: taskData.title,
        notes: taskData.notes || '',
        due: taskData.due,
        starred: taskData.starred,
        position: taskToUpdate.position // positionも同期キューに追加
      });
      
      // 同期状態を更新
      updateSyncStatus();
      
      // フィルタリングとソートを再適用
      applyFilterAndSort(updatedTodos);
      
      console.log(`Task ${taskId} updated successfully`);
    } catch (err) {
      console.error('Failed to update task:', err);
      setError(`タスクの更新に失敗しました。${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // タスクリストを削除
  const deleteTaskList = async (listId) => {
    try {
      setLoading(true);
      setError(null);
      
      // メモリ内のタスクリストを削除
      const updatedLists = taskLists.filter(list => list.id !== listId);
      setTaskLists(updatedLists);
      
      // このリストに属するタスクも削除
      const updatedTodos = todos.filter(task => task.listId !== listId);
      setTodos(updatedTodos);
      
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
      
      // 同期キューに追加
      syncService.addToSyncQueue('taskList', 'delete', listId);
      
      // 同期状態を更新
      updateSyncStatus();
      
      // フィルタリングとソートを再適用
      applyFilterAndSort(updatedTodos);
      
      console.log(`Task list ${listId} deleted successfully`);
    } catch (err) {
      console.error('Failed to delete task list:', err);
      setError(`タスクリストの削除に失敗しました。${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // タスクの並び替え
  const reorderTasks = (updatedTodos) => {
    try {
      // 並び替えられたタスクにposition値を設定
      const todosWithPosition = updatedTodos.map((task, index) => ({
        ...task,
        position: `${Date.now() + index}`
      }));
      
      // 状態を更新
      setFilteredTodos(todosWithPosition);
      
      // 元のtodosも更新
      setTodos(prevTodos => {
        const newTodos = [...prevTodos];
        todosWithPosition.forEach(updatedTask => {
          const index = newTodos.findIndex(t => t.id === updatedTask.id);
          if (index !== -1) {
            newTodos[index] = { ...newTodos[index], position: updatedTask.position };
          }
        });
        return newTodos;
      });
      
      // フィルタリングとソートを再適用
      applyFilterAndSort(todosWithPosition);
      
      console.log('Tasks reordered successfully');
    } catch (err) {
      console.error('Failed to reorder tasks:', err);
      setError(`タスクの並び替えに失敗しました。${err.message}`);
    }
  };

  return (
    <TodoContext.Provider
      value={{
        todos: filteredTodos,
        allTodos: todos,
        taskLists,
        selectedTaskList,
        selectedFilter,
        showCompleted,
        loading,
        error,
        syncStatus,
        createTask,
        selectTaskList,
        selectFilter,
        toggleShowCompleted,
        updateTaskListTitle,
        moveTaskToList,
        deleteTask,
        toggleTaskCompletion,
        reorderTaskLists,
        updateTask,
        deleteTaskList,
        manualSync,
        reorderTasks
      }}
    >
      {children}
    </TodoContext.Provider>
  );
};

export const useTodo = () => useContext(TodoContext);
