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

  // 初期データの読み込み
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User is authenticated, fetching task lists');
      // 初期同期を実行
      initialSync();
      // 定期的な同期を開始（5分間隔）
      syncService.startPeriodicSync(300000);
      
      // コンポーネントのアンマウント時に定期同期を停止
      return () => {
        syncService.stopPeriodicSync();
      };
    } else {
      console.log('User is not authenticated, skipping task fetch');
      setTaskLists([]);
      setTodos([]);
      setFilteredTodos([]);
      setLoading(false);
    }
  }, [isAuthenticated]);

  // 初期同期処理
  const initialSync = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 初期同期を実行
      const { taskLists: lists, tasks } = await syncService.initialSync();
      
      console.log('Initial sync completed, received data:', { lists, tasks });
      
      // タスクリストを設定
      setTaskLists(lists);
      
      // タスクを設定
      const tasksWithMetadata = tasks.map(task => {
        // スター状態を抽出
        const isStarred = extractStarredStatus(task);
        
        return {
          ...task,
          startDate: task.due, // dueフィールドをstartDateとして使用
          starred: isStarred // 抽出したスター状態を設定
        };
      });
      
      // タスクをposition順にソート
      const sortedTasks = [...tasksWithMetadata].sort((a, b) => {
        // positionが文字列の場合は数値に変換
        const posA = typeof a.position === 'string' ? parseFloat(a.position) : a.position;
        const posB = typeof b.position === 'string' ? parseFloat(b.position) : b.position;
        return posA - posB;
      });
      
      setTodos(sortedTasks);
      
      // デフォルトのタスクリストを選択
      if (lists && lists.length > 0) {
        const defaultList = lists.find(list => list.title === 'マイタスク') || lists[0];
        setSelectedTaskList(defaultList.id);
      }
      
      // 同期状態を更新
      updateSyncStatus();
    } catch (err) {
      console.error('Failed to perform initial sync:', err);
      
      // スコープ不足エラーの場合、明示的なスコープ承認を要求
      if (err.message && (err.message.includes('insufficient authentication scopes') || 
          err.message.includes('API error: 401'))) {
        console.log('Insufficient scopes detected, requesting explicit authorization');
        requestTasksScope();
        return;
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
      // フィルターが選択されている場合は、filterTodos()を使用
      if (selectedFilter) {
        filterTodos();
      } else {
        // フィルターが選択されていない場合は、filterTodosByList()を使用
        filterTodosByList(selectedTaskList);
      }
    }
  }, [isAuthenticated, selectedTaskList]); // todosを依存配列から除外

  // フィルターが変更されたときにタスクをフィルタリング
  useEffect(() => {
    if (isAuthenticated) {
      console.log(`Filter changed to: ${selectedFilter}`);
      filterTodos();
    }
  }, [isAuthenticated, selectedFilter]); // todosを依存配列から除外

  // showCompletedが変更されたときのみフィルタリング
  useEffect(() => {
    if (isAuthenticated && todos.length > 0) {
      console.log('[DEBUG] showCompleted が変更されました');
      filterTodos();
    }
  }, [showCompleted]); // showCompletedのみに依存

  // todosが変更されたときの処理（初期ロード時のみ）
  useEffect(() => {
    if (isAuthenticated && todos.length > 0) {
      console.log('[DEBUG] todos が初期化されました');
      // 初期ロード時のみフィルタリングを実行
      if (selectedFilter) {
        filterTodos();
      } else if (selectedTaskList) {
        filterTodosByList(selectedTaskList);
      } else {
        filterTodos();
      }
    }
  }, [isAuthenticated && todos.length > 0]); // 初期化時のみ実行

  // 選択されたリストに基づいてタスクをフィルタリング
  const filterTodosByList = (listId) => {
    if (!todos || !todos.length) {
      console.log('No todos to filter by list');
      setFilteredTodos([]);
      return;
    }

    console.log(`Filtering todos by list: ${listId}`);
    
    // 選択されたリストのタスクのみをフィルタリング
    let filtered = todos.filter(todo => todo.listId === listId);
    
    // 完了タスクのフィルタリング
    if (!showCompleted) {
      filtered = filtered.filter(todo => todo.status !== 'completed');
    }
    
    // タスクを並び替え
    // 1. 期限順（昇順、なしは最後）
    // 2. マイリスト順（この関数ではすでに特定のリストに絞られている）
    // 3. position順
    const sortedFiltered = sortTasks(filtered);
    
    // フィルタリングされたタスクを設定
    setFilteredTodos(sortedFiltered);
  };

  // タスクのフィルタリング
  const filterTodos = (todosToFilter = todos) => {
    if (!todosToFilter || !todosToFilter.length) {
      console.log('[DEBUG] No todos to filter');
      setFilteredTodos([]);
      return;
    }

    console.log(`[DEBUG] Filtering ${todosToFilter.length} todos with filter: ${selectedFilter}`);
    
    let filtered = [...todosToFilter];
    
    // フィルターが選択されていない場合のみ、マイリストでフィルタリング
    if (!selectedFilter && selectedTaskList && selectedTaskList !== 'all') {
      filtered = filtered.filter(todo => todo.listId === selectedTaskList);
    }
    
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
    
    console.log('[DEBUG] フィルタリング後のタスク数:', filtered.length);
    
    // ソートを適用（安定ソートを使用）
    let sortedFiltered = sortTasks(filtered);
    
    console.log('[DEBUG] ソート後のタスク:', sortedFiltered.map(task => ({
      id: task.id,
      title: task.title,
      position: task.position,
      startDate: task.startDate
    })));
    
    // 同期的に状態を更新
    setFilteredTodos(sortedFiltered);
  };

  // タスクを指定された順序で並び替える関数
  const sortTasks = (tasks) => {
    console.log('[DEBUG] sortTasks called - タスクのソート開始');
    console.log('[DEBUG] ソート前のタスク順序:', tasks.map(t => ({ id: t.id, title: t.title, position: t.position })));
    
    const sorted = [...tasks].sort((a, b) => {
      // 1. 期限順（昇順、なしは最後）
      if (a.startDate !== b.startDate) {
        // 期限なしのタスクは最後に配置
        if (!a.startDate) return 1;
        if (!b.startDate) return -1;
        
        try {
          const dateA = parseISO(a.startDate);
          const dateB = parseISO(b.startDate);
          const dateDiff = dateA - dateB;
          if (dateDiff !== 0) {
            console.log(`[DEBUG] 日付ソート: ${a.title} vs ${b.title} = ${dateDiff}`);
            return dateDiff;
          }
        } catch (e) {
          console.error('[DEBUG] Date parsing error:', e);
        }
      }
      
      // 2. マイリスト順（taskListsの順序に基づく）
      if (a.listId !== b.listId) {
        const listA = taskLists.findIndex(list => list.id === a.listId);
        const listB = taskLists.findIndex(list => list.id === b.listId);
        const indexA = listA === -1 ? Number.MAX_SAFE_INTEGER : listA;
        const indexB = listB === -1 ? Number.MAX_SAFE_INTEGER : listB;
        const listDiff = indexA - indexB;
        if (listDiff !== 0) {
          console.log(`[DEBUG] リストソート: ${a.title} vs ${b.title} = ${listDiff}`);
          return listDiff;
        }
      }
      
      // 3. position順（同じ日付、同じリストの場合）
      const posA = a.position ? (typeof a.position === 'string' ? parseFloat(a.position) : a.position) : 0;
      const posB = b.position ? (typeof b.position === 'string' ? parseFloat(b.position) : b.position) : 0;
      
      const posDiff = posA - posB;
      if (posDiff !== 0) {
        console.log(`[DEBUG] Positionソート: ${a.title} vs ${b.title} = ${posDiff}`);
        return posDiff;
      }
      
      // 4. 最後の手段として、IDで安定ソート
      const idDiff = a.id.localeCompare(b.id);
      if (idDiff !== 0) {
        console.log(`[DEBUG] IDソート: ${a.title} vs ${b.title} = ${idDiff}`);
      }
      return idDiff;
    });
    
    console.log('[DEBUG] ソート後のタスク順序:', sorted.map(t => ({ id: t.id, title: t.title, position: t.position })));
    return sorted;
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
      setTodos(prevTodos => [...prevTodos, newTask]);
      
      // 同期キューに追加
      syncService.addToSyncQueue('task', 'create', {
        ...newTask,
        listId: listId
      });
      
      // 同期状態を更新
      updateSyncStatus();
      
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
      setTaskLists(prevLists => 
        prevLists.map(list => 
          list.id === taskListId ? { ...list, title: newTitle } : list
        )
      );
      
      // 同期キューに追加
      syncService.addToSyncQueue('taskList', 'update', {
        id: taskListId,
        title: newTitle
      });
      
      // 同期状態を更新
      updateSyncStatus();
      
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
      setTodos(prevTodos => 
        prevTodos.map(task => 
          task.id === taskId ? { ...task, listId: targetListId } : task
        )
      );
      
      // 同期キューに追加
      syncService.addToSyncQueue('task', 'update', {
        id: taskId,
        listId: sourceListId,
        newListId: targetListId
      });
      
      // 同期状態を更新
      updateSyncStatus();
      
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
      setTodos(prevTodos => prevTodos.filter(task => task.id !== taskId));
      
      // 同期キューに追加
      syncService.addToSyncQueue('task', 'delete', {
        id: taskId,
        listId: listId
      });
      
      // 同期状態を更新
      updateSyncStatus();
      
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
      setTodos(prevTodos => 
        prevTodos.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
      
      // 同期キューに追加
      syncService.addToSyncQueue('task', 'update', {
        id: taskId,
        listId: listId,
        status: newStatus,
        completed: newStatus === 'completed' ? new Date().toISOString() : null
      });
      
      // 同期状態を更新
      updateSyncStatus();
      
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
      
      // 同期キューに追加
      // Google Tasks APIには直接的なリスト並び替え機能がないため、
      // フロントエンドでの表示順序のみを管理する
      
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
      
      console.log(`[DEBUG] タスク更新開始: ${taskToUpdate.title}`);
      
      // 更新されたタスクオブジェクト
      const updatedTask = {
        ...taskToUpdate,
        title: taskData.title,
        notes: taskData.notes || '',
        startDate: taskData.due,
        due: taskData.due,
        starred: taskData.starred
      };
      
      // todosを更新（メインのタスクリスト）
      const newTodos = todos.map(task => task.id === taskId ? updatedTask : task);
      setTodos(newTodos);
      
      // filteredTodosを直接更新（順序を保持）
      setFilteredTodos(prevFiltered => {
        const taskIndex = prevFiltered.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
          // 日付が変更された場合は再フィルタリングが必要
          const isDateChanged = taskToUpdate.startDate !== taskData.due;
          
          if (isDateChanged) {
            console.log('[DEBUG] 日付変更のため再フィルタリング');
            // 日付変更時は非同期で完全なフィルタリングを実行
            setTimeout(() => {
              filterTodos(newTodos);
            }, 10);
            return prevFiltered; // 一時的に現在の状態を返す
          } else {
            // 日付変更なしの場合は該当タスクのみ更新
            console.log('[DEBUG] 日付変更なし、該当タスクのみ更新');
            const newFiltered = [...prevFiltered];
            newFiltered[taskIndex] = updatedTask;
            return newFiltered;
          }
        }
        return prevFiltered;
      });
      
      // 同期キューに追加
      syncService.addToSyncQueue('task', 'update', {
        id: taskId,
        listId: listId,
        title: taskData.title,
        notes: taskData.notes || '',
        due: taskData.due,
        starred: taskData.starred,
        position: taskToUpdate.position
      });
      
      // 同期状態を更新
      updateSyncStatus();
      
      console.log(`[DEBUG] タスク更新完了: ${taskData.title}`);
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
      setTaskLists(prevLists => prevLists.filter(list => list.id !== listId));
      
      // このリストに属するタスクも削除
      setTodos(prevTodos => prevTodos.filter(task => task.listId !== listId));
      
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
      
      console.log(`Task list ${listId} deleted successfully`);
    } catch (err) {
      console.error('Failed to delete task list:', err);
      setError(`タスクリストの削除に失敗しました。${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // 新しいタスクリストを作成
  const createTaskList = async (title) => {
    try {
      setLoading(true);
      setError(null);
      
      // 一時的なIDを生成
      const tempId = `temp-list-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // メモリ内に新しいタスクリストを追加
      const newList = {
        id: tempId,
        title: title
      };
      
      setTaskLists(prevLists => [...prevLists, newList]);
      
      // 同期キューに追加
      syncService.addToSyncQueue('taskList', 'create', {
        title: title
      });
      
      // 同期状態を更新
      updateSyncStatus();
      
      console.log('Created new task list:', newList);
      
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
      
      // メモリ内のタスクを更新
      setTodos(prevTodos => {
        // 並び替え対象のタスクのIDを取得
        const reorderedIds = new Set(newTasks.map(task => task.id));
        
        // 並び替え対象外のタスクを保持
        const unchangedTasks = prevTodos.filter(task => !reorderedIds.has(task.id));
        
        // 並び替えられたタスクと変更されていないタスクを結合
        return [...unchangedTasks, ...newTasks];
      });
      
      // 同期キューに追加
      if (newTasks.length > 0) {
        const listId = newTasks[0].listId;
        syncService.addToSyncQueue('task', 'reorder', {
          listId,
          tasks: newTasks
        });
      }
      
      // 同期状態を更新
      updateSyncStatus();
      
      console.log('Tasks reordered');
    } catch (err) {
      console.error('Failed to reorder tasks:', err);
      setError(`タスクの並び替えに失敗しました。${err.message}`);
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
    syncStatus,
    manualSync,
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

