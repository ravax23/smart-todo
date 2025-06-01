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
        deleted: [],
        reordered: []
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
      } else if (action === 'reorder') {
        this.pendingChanges.tasks.reordered.push(data);
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
          deleted: [],
          reordered: []
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
        await TasksService.createTaskList(taskList.title);
      } catch (error) {
        console.error('Error creating task list:', error);
      }
    }
    
    // 更新されたタスクリストの同期
    for (const taskList of this.pendingChanges.taskLists.updated) {
      try {
        console.log('Updating task list:', taskList);
        await TasksService.updateTaskList(taskList.id, { title: taskList.title });
      } catch (error) {
        console.error('Error updating task list:', error);
      }
    }
    
    // 削除されたタスクリストの同期
    for (const taskListId of this.pendingChanges.taskLists.deleted) {
      try {
        console.log('Deleting task list:', taskListId);
        await TasksService.deleteTaskList(taskListId);
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
        if (task.due !== undefined) updateData.due = task.due;
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
    
    // 並び替えられたタスクの同期
    for (const reorderData of this.pendingChanges.tasks.reordered) {
      try {
        console.log('Reordering tasks:', reorderData);
        const { listId, tasks } = reorderData;
        
        // タスクの順序を更新
        for (let i = 0; i < tasks.length; i++) {
          const task = tasks[i];
          const previousTask = i > 0 ? tasks[i - 1] : null;
          
          await TasksService.moveTask(
            listId,
            task.id,
            previousTask ? previousTask.id : null
          );
        }
      } catch (error) {
        console.error('Error reordering tasks:', error);
      }
    }
  }

  /**
   * 定期的な同期を開始
   * @param {number} intervalMs - 同期間隔（ミリ秒）
   */
  startPeriodicSync(intervalMs = 60000) { // デフォルトは1分間隔
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (this.syncQueue.length > 0) {
        console.log(`Periodic sync triggered with ${this.syncQueue.length} items in queue`);
        this.startSync();
      }
    }, intervalMs);
    
    console.log(`Periodic sync started with interval: ${intervalMs}ms`);
  }

  /**
   * 定期的な同期を停止
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Periodic sync stopped');
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
          deleted: this.pendingChanges.tasks.deleted.length,
          reordered: this.pendingChanges.tasks.reordered.length
        }
      }
    };
  }
}

// シングルトンインスタンスをエクスポート
const syncService = new SyncService();
export default syncService;
