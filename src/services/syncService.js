/**
 * Google Tasks APIとの同期を管理するサービス
 * メモリ内のタスクとGoogle Tasksを非同期で同期する
 */
import TasksService from './tasksService';

class SyncService {
  constructor() {
    this.syncQueue = [];
    this.isSyncing = false;
    this.syncInterval = null;
    this.lastSyncTime = null;
    this.pendingChanges = {
      taskLists: {
        created: [],
        updated: [],
        deleted: []
      },
      tasks: {
        created: [],
        updated: [],
        deleted: []
      }
    };
  }

  /**
   * 同期キューに操作を追加
   * @param {string} type - 操作タイプ ('taskList' または 'task')
   * @param {string} action - アクション ('create', 'update', 'delete', 'reorder')
   * @param {Object} data - 操作に関連するデータ
   */
  addToSyncQueue(type, action, data) {
    console.log(`Adding to sync queue: ${type} - ${action}`, data);
    
    // データの検証
    if (!data) {
      console.error('Invalid data for sync queue:', { type, action, data });
      return;
    }
    
    // タスクリスト更新時のIDチェック
    if (type === 'taskList' && action === 'update') {
      if (!data.id) {
        console.error('Missing task list ID for update:', data);
        return;
      }
      
      // IDの形式を検証
      if (typeof data.id !== 'string' || data.id === 'undefined' || data.id === 'null') {
        console.error('Invalid task list ID format:', data.id);
        return;
      }
      
      if (!data.title && !data.color) {
        console.error('Missing update properties for task list:', data);
        return;
      }
    }
    
    // 同期キューに追加
    this.syncQueue.push({
      type,
      action,
      data,
      timestamp: new Date().getTime()
    });
    
    // 対応する変更を記録
    if (type === 'taskList') {
      if (action === 'create') {
        this.pendingChanges.taskLists.created.push(data);
      } else if (action === 'update') {
        this.pendingChanges.taskLists.updated.push(data);
      } else if (action === 'delete') {
        this.pendingChanges.taskLists.deleted.push(data);
      }
    } else if (type === 'task') {
      if (action === 'create') {
        this.pendingChanges.tasks.created.push(data);
      } else if (action === 'update') {
        this.pendingChanges.tasks.updated.push(data);
      } else if (action === 'delete') {
        this.pendingChanges.tasks.deleted.push(data);
      }
    }
    
    // 同期を開始
    this.startSync();
  }

  /**
   * 同期処理を開始
   */
  async startSync() {
    if (this.isSyncing) {
      console.log('Sync already in progress, queuing...');
      return;
    }
    
    this.isSyncing = true;
    
    try {
      console.log('Starting sync process...');
      
      // タスクリストの同期
      await this.syncTaskLists();
      
      // タスクの同期
      await this.syncTasks();
      
      // 同期完了時の処理
      this.lastSyncTime = new Date().getTime();
      console.log('Sync completed at:', new Date(this.lastSyncTime).toLocaleString());
      
      // 同期キューをクリア
      this.syncQueue = [];
      
      // 保留中の変更をリセット
      this.pendingChanges = {
        taskLists: {
          created: [],
          updated: [],
          deleted: []
        },
        tasks: {
          created: [],
          updated: [],
          deleted: []
        }
      };
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.isSyncing = false;
      
      // キューに残りがある場合は再度同期を開始
      if (this.syncQueue.length > 0) {
        console.log(`${this.syncQueue.length} items remaining in queue, continuing sync...`);
        setTimeout(() => this.startSync(), 1000); // 1秒後に再試行
      }
    }
  }

  /**
   * タスクリストの同期
   */
  async syncTaskLists() {
    // 作成されたタスクリストの同期
    for (const taskList of this.pendingChanges.taskLists.created) {
      try {
        console.log('Creating task list:', taskList);
        
        // 一時的なIDを持つタスクリストかどうかを確認
        const isTempId = taskList.id && taskList.id.startsWith('temp-list-');
        
        if (isTempId) {
          console.log('Creating task list with temporary ID:', taskList.id);
        }
        
        // タスクリストを作成し、実際のIDを取得
        const createdTaskList = await TasksService.createTaskList(taskList.title);
        
        if (isTempId) {
          console.log(`Task list created with real ID: ${createdTaskList.id} (was temp ID: ${taskList.id})`);
          
          // 一時的なIDと実際のIDのマッピングをイベントとして発行
          const mappingEvent = new CustomEvent('taskListIdMapped', {
            detail: {
              tempId: taskList.id,
              realId: createdTaskList.id
            }
          });
          window.dispatchEvent(mappingEvent);
        }
      } catch (error) {
        console.error('Error creating task list:', error);
      }
    }
    
    // 更新されたタスクリストの同期
    for (const taskList of this.pendingChanges.taskLists.updated) {
      try {
        console.log('Updating task list:', taskList);
        
        // タスクリストオブジェクトの検証
        if (!taskList) {
          console.error('Task list object is null or undefined');
          continue;
        }
        
        // タスクリストIDの検証
        if (!taskList.id || taskList.id === 'undefined' || taskList.id === 'null') {
          console.error('Invalid task list ID:', taskList);
          continue;
        }
        
        // タスクリストIDの形式を検証
        if (typeof taskList.id !== 'string') {
          console.error('Task list ID is not a string:', taskList);
          continue;
        }
        
        // 一時的なIDかどうかを確認
        if (taskList.id.startsWith('temp-list-')) {
          console.error('Cannot update task list with temporary ID:', taskList.id);
          continue;
        }
        
        // タスクリストタイトルの検証
        if (!taskList.title) {
          console.error('Task list title is missing:', taskList);
          continue;
        }
        
        console.log('Calling updateTaskList with ID:', taskList.id, 'and title:', taskList.title);
        
        // タスクリストIDの検証
        if (!taskList.id || typeof taskList.id !== 'string' || taskList.id.trim() === '') {
          console.error('Invalid task list ID:', taskList.id);
          continue;
        }
        
        try {
          // TasksServiceのupdateTaskListメソッドを直接呼び出す
          await TasksService.updateTaskList(taskList.id, { title: taskList.title });
          console.log('Task list updated successfully:', taskList.id);
        } catch (updateError) {
          console.error('Error updating task list:', updateError);
          
          // 一時的なIDの場合は、作成キューに移動
          if (updateError.message && updateError.message.includes('Cannot update task list with temporary ID')) {
            console.log('Moving task list to creation queue:', taskList);
            this.pendingChanges.taskLists.created.push(taskList);
          }
        }
      } catch (error) {
        console.error('Error processing task list update:', error);
      }
    }
    
    // 削除されたタスクリストの同期
    for (const taskListId of this.pendingChanges.taskLists.deleted) {
      try {
        console.log('Deleting task list:', taskListId);
        if (!taskListId || taskListId === 'undefined' || taskListId === 'null') {
          console.error('Invalid task list ID for deletion:', taskListId);
          continue;
        }
        await TasksService.deleteTaskList(taskListId);
        console.log('Task list deleted successfully:', taskListId);
      } catch (error) {
        console.error('Error deleting task list:', error);
      }
    }
  }

  /**
   * タスクの同期
   */
  async syncTasks() {
    // 作成されたタスクの同期
    for (const task of this.pendingChanges.tasks.created) {
      try {
        console.log('Creating task:', task);
        await TasksService.createTask(task.listId, {
          title: task.title,
          notes: task.notes || '',
          due: task.due,
          starred: task.starred,
          status: task.status || 'needsAction'
        });
      } catch (error) {
        console.error('Error creating task:', error);
      }
    }
    
    // 更新されたタスクの同期
    for (const task of this.pendingChanges.tasks.updated) {
      try {
        console.log('Updating task:', task);
        
        // タスクの更新データを準備
        const updateData = {};
        
        // 必要なフィールドのみを含める
        if (task.title !== undefined) updateData.title = task.title;
        if (task.notes !== undefined) updateData.notes = task.notes || '';
        
        // 期限の更新を明示的に処理
        if (task.due !== undefined) {
          console.log(`Explicitly setting due date in sync: ${task.due}`);
          updateData.due = task.due;
        }
        
        if (task.starred !== undefined) updateData.starred = task.starred;
        if (task.status !== undefined) updateData.status = task.status;
        if (task.completed !== undefined) updateData.completed = task.completed;
        
        // タスクを更新
        await TasksService.updateTask(task.listId, task.id, updateData);
      } catch (error) {
        console.error('Error updating task:', error);
      }
    }
    
    // 削除されたタスクの同期
    for (const task of this.pendingChanges.tasks.deleted) {
      try {
        console.log('Deleting task:', task);
        await TasksService.deleteTask(task.listId, task.id);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  }

  /**
   * 定期的なデータ読み込みを開始（読み込み専用）
   * @param {number} intervalMs - 読み込み間隔（ミリ秒）
   */
  startPeriodicDataFetch(intervalMs = 300000) { // デフォルトは5分間隔
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(async () => {
      try {
        console.log('Periodic data fetch triggered');
        await this.fetchLatestData();
      } catch (error) {
        console.error('Periodic data fetch error:', error);
      }
    }, intervalMs);
    
    console.log(`Periodic data fetch started with interval: ${intervalMs}ms`);
  }

  /**
   * 最新データの取得（読み込み専用）
   */
  async fetchLatestData() {
    try {
      console.log('Fetching latest data from Google Tasks...');
      
      // タスクリストを取得
      const taskLists = await TasksService.getTaskLists();
      
      // 各タスクリストのタスクを取得
      const allTasks = [];
      for (const list of taskLists) {
        const tasks = await TasksService.getTasks(list.id);
        const tasksWithListId = tasks.map(task => ({
          ...task,
          listId: list.id
        }));
        allTasks.push(...tasksWithListId);
      }
      
      console.log('Latest data fetched successfully');
      
      // データ更新イベントを発行
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dataUpdated', {
          detail: { taskLists, tasks: allTasks }
        }));
      }
      
      return { taskLists, tasks: allTasks };
    } catch (error) {
      console.error('Error fetching latest data:', error);
      throw error;
    }
  }

  /**
   * 定期的なデータ読み込みを停止
   */
  stopPeriodicDataFetch() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Periodic data fetch stopped');
    }
  }

  /**
   * 初期データの同期（アプリ起動時）
   * Google Tasksからデータを取得してローカルに保存
   */
  async initialSync() {
    try {
      console.log('Starting initial sync...');
      
      // タスクリストを取得
      const taskLists = await TasksService.getTaskLists();
      
      // 各タスクリストのタスクを取得
      const allTasks = [];
      for (const list of taskLists) {
        const tasks = await TasksService.getTasks(list.id);
        const tasksWithListId = tasks.map(task => ({
          ...task,
          listId: list.id
        }));
        allTasks.push(...tasksWithListId);
      }
      
      console.log('Initial sync completed');
      this.lastSyncTime = new Date().getTime();
      
      return {
        taskLists,
        tasks: allTasks
      };
    } catch (error) {
      console.error('Initial sync error:', error);
      throw error;
    }
  }

  /**
   * 同期状態を取得
   */
  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      queueLength: this.syncQueue.length,
      pendingChanges: {
        taskLists: {
          created: this.pendingChanges.taskLists.created.length,
          updated: this.pendingChanges.taskLists.updated.length,
          deleted: this.pendingChanges.taskLists.deleted.length
        },
        tasks: {
          created: this.pendingChanges.tasks.created.length,
          updated: this.pendingChanges.tasks.updated.length,
          deleted: this.pendingChanges.tasks.deleted.length
        }
      }
    };
  }
}

// シングルトンインスタンスをエクスポート
const syncService = new SyncService();
export default syncService;
