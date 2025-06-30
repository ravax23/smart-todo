import { getAccessToken } from './authService';
import { setStarredStatus, validateTaskListId } from './tasksUtils';
import { tasksApi } from './apiService';

/**
 * Google Tasks APIクライアント
 * AWS Lambda + API Gateway経由でGoogle Tasks APIを呼び出す
 */
class TasksService {
  /**
   * タスクリストの一覧を取得
   */
  static async getTaskLists() {
    try {
      console.log('Fetching task lists');
      
      // デバイス情報を記録
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
        isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1
      };
      console.log('Device info:', deviceInfo);
      
      // アクセストークンの確認
      const token = getAccessToken();
      console.log('Access token available:', !!token);
      
      if (!token) {
        console.error('Access token not found');
        
        // モバイルデバイスの場合は待機時間を長くする
        const waitTime = deviceInfo.isMobile ? 15000 : 10000;
        console.log(`Waiting ${waitTime/1000} seconds for token...`);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        const retryToken = getAccessToken();
        console.log('Retry token available:', !!retryToken);
        
        if (!retryToken) {
          console.error('Access token still not found after retry');
          
          // モバイルデバイスの場合は自動的に再認証を試みる
          if (deviceInfo.isMobile) {
            console.log('Mobile device detected, attempting re-authentication');
            // 認証状態をリセット
            localStorage.removeItem('google_access_token');
            localStorage.removeItem('google_auth_token');
            sessionStorage.removeItem('google_access_token');
            sessionStorage.removeItem('google_auth_token');
            
            // 認証ページにリダイレクト
            const redirectUri = window.location.origin;
            const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
            const SCOPES = 'https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/tasks.readonly';
            
            // ポップアップウィンドウのサイズと位置を計算
            const width = 500;
            const height = 600;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2.5;
            
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(SCOPES)}&prompt=select_account&include_granted_scopes=true`;
            
            console.log('Opening auth URL in popup window for mobile device');
            
            // ポップアップウィンドウを開く
            const popup = window.open(
              authUrl,
              'googleAuthPopup',
              `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
            );
            
            if (!popup) {
              console.error('Failed to open popup window');
              throw new Error('ポップアップウィンドウを開けませんでした。ポップアップブロッカーを無効にしてください。');
            }
            return [];
          }
          
          throw new Error('アクセストークンがありません。再度ログインしてください。');
        } else {
          console.log('Access token found after retry');
          return this.getTaskLists(); // 再帰的に呼び出し
        }
      }
      
      // API Gateway経由でタスクリストを取得
      const response = await tasksApi.getTaskLists();
      console.log('Task lists response:', response);
      
      // タスクリストを整形して返す
      const taskLists = response.items || [];
      return taskLists.map(list => this.formatTaskList(list));
    } catch (error) {
      console.error('Tasks Service Error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * 新しいタスクリストを作成
   */
  static async createTaskList(title) {
    try {
      console.log(`Creating new task list: ${title}`);
      
      // アクセストークンの確認
      const token = getAccessToken();
      if (!token) {
        throw new Error('アクセストークンがありません。再度ログインしてください。');
      }
      
      // API Gateway経由でタスクリストを作成
      const response = await tasksApi.createTaskList(title);
      console.log('Create task list response:', response);
      
      // 作成されたタスクリストを整形して返す
      return this.formatTaskList(response);
    } catch (error) {
      console.error('Tasks Service Error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * タスクリストを更新
   */
  static async updateTaskList(taskListId, updates) {
    try {
      console.log(`Updating task list ${taskListId}:`, updates);
      console.log('Task list ID type:', typeof taskListId);
      console.log('Task list ID value:', taskListId);
      
      // タスクリストIDの検証（共通関数を使用）
      validateTaskListId(taskListId);
      
      // アクセストークンの確認
      const token = getAccessToken();
      if (!token) {
        throw new Error('Access token not available');
      }
      
      // 更新データの検証
      if (!updates || typeof updates !== 'object') {
        console.error('Invalid updates object:', updates);
        throw new Error('Invalid updates object');
      }
      
      // タイトルの検証（タイトルが更新される場合）
      if (updates.title !== undefined && (!updates.title || typeof updates.title !== 'string')) {
        console.error('Invalid title in updates:', updates.title);
        throw new Error('Invalid title');
      }
      
      // API Gateway経由でタスクリストを更新
      const response = await tasksApi.updateTaskList(taskListId, updates);
      console.log('Update task list response:', response);
      
      return this.formatTaskList(response);
    } catch (error) {
      console.error('Tasks Service Error:', {
        message: error.message,
        stack: error.stack,
        taskListId,
        updates
      });
      throw error;
    }
  }

  /**
   * タスクリストデータを整形する
   * @param {Object} taskList - Google Tasks APIから返されたタスクリストデータ
   * @returns {Object} 整形されたタスクリストデータ
   */
  static formatTaskList(taskList) {
    if (!taskList) {
      console.error('Invalid task list data:', taskList);
      throw new Error('Invalid task list data');
    }
    
    if (!taskList.id) {
      console.error('Task list is missing ID:', taskList);
      throw new Error('Task list is missing ID');
    }
    
    console.log('Formatting task list:', taskList);
    
    // IDをそのまま使用（変換なし）
    const normalizedId = taskList.id.trim();
    
    console.log('Original ID:', taskList.id);
    console.log('Normalized ID:', normalizedId);
    
    // 必要なプロパティを抽出して返す
    return {
      id: normalizedId,
      title: taskList.title || 'Untitled',
      updated: taskList.updated || new Date().toISOString(),
      // その他必要なプロパティがあれば追加
    };
  }

  /**
   * タスクリストを削除
   */
  static async deleteTaskList(taskListId) {
    try {
      console.log(`Deleting task list ${taskListId}`);
      
      // タスクリストIDの検証
      if (!taskListId || taskListId === 'undefined' || taskListId === 'null') {
        console.error('Invalid task list ID:', taskListId);
        throw new Error('無効なタスクリストIDです。');
      }
      
      // アクセストークンの確認
      const token = getAccessToken();
      if (!token) {
        throw new Error('アクセストークンがありません。再度ログインしてください。');
      }
      
      // API Gateway経由でタスクリストを削除
      await tasksApi.deleteTaskList(taskListId);
      console.log('Task list deleted successfully');
      
      return true;
    } catch (error) {
      console.error('Tasks Service Error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * すべてのタスクリストからタスクを取得
   */
  static async getAllTasks(taskLists) {
    try {
      console.log('Fetching tasks from all lists');
      
      if (!taskLists || !taskLists.length) {
        console.log('No task lists provided');
        return [];
      }
      
      // 各タスクリストからタスクを取得
      const tasksPromises = taskLists.map(list => this.getTasks(list.id));
      const tasksResults = await Promise.all(tasksPromises);
      
      // 各タスクにリストIDを追加して結合
      const allTasks = [];
      tasksResults.forEach((tasks, index) => {
        if (tasks && tasks.length) {
          const tasksWithListId = tasks.map(task => ({
            ...task,
            listId: taskLists[index].id
          }));
          allTasks.push(...tasksWithListId);
        }
      });
      
      console.log(`Fetched ${allTasks.length} tasks from all lists`);
      return allTasks;
    } catch (error) {
      console.error('Error fetching all tasks:', error);
      throw error;
    }
  }
  
  /**
   * タスクリストからタスクを取得
   */
  static async getTasks(taskListId) {
    try {
      console.log(`Fetching tasks from list ${taskListId}`);
      
      // アクセストークンの確認
      const token = getAccessToken();
      if (!token) {
        throw new Error('アクセストークンがありません。再度ログインしてください。');
      }
      
      // API Gateway経由でタスクを取得
      const params = {
        showCompleted: true,
        showHidden: true,
        maxResults: 100
      };
      
      const response = await tasksApi.getTasks(taskListId, params);
      return response.items || [];
    } catch (error) {
      console.error('Tasks Service Error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * 新しいタスクを作成
   */
  static async createTask(taskListId, taskData) {
    try {
      console.log(`Creating new task in list ${taskListId}:`, taskData);
      
      // アクセストークンの確認
      const token = getAccessToken();
      if (!token) {
        throw new Error('アクセストークンがありません。再度ログインしてください。');
      }
      
      // スター状態を適切なプロパティに設定
      let apiTaskData = { ...taskData };
      if ('starred' in taskData) {
        apiTaskData = setStarredStatus(apiTaskData, taskData.starred);
      }
      
      // API Gateway経由でタスクを作成
      const response = await tasksApi.createTask(taskListId, apiTaskData);
      console.log('Create task response:', response);
      
      return response;
    } catch (error) {
      console.error('Tasks Service Error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * タスクを取得
   */
  static async getTask(taskListId, taskId) {
    try {
      console.log(`Fetching task ${taskId} from list ${taskListId}`);
      
      // アクセストークンの確認
      const token = getAccessToken();
      if (!token) {
        throw new Error('アクセストークンがありません。再度ログインしてください。');
      }
      
      // API Gateway経由でタスクを取得
      const response = await tasksApi.getTask(taskListId, taskId);
      return response;
    } catch (error) {
      console.error('Error fetching task:', error);
      throw error;
    }
  }
  
  /**
   * タスクを更新
   */
  static async updateTask(taskListId, taskId, updates) {
    try {
      console.log(`Updating task ${taskId} in list ${taskListId}:`, updates);
      
      // アクセストークンの確認
      const token = getAccessToken();
      if (!token) {
        throw new Error('アクセストークンがありません。再度ログインしてください。');
      }
      
      // スター状態を適切なプロパティに設定
      let apiUpdates = { ...updates };
      if ('starred' in updates) {
        apiUpdates = setStarredStatus(apiUpdates, updates.starred);
      }
      
      // 現在のタスクを取得
      const currentTask = await this.getTask(taskListId, taskId);
      console.log('Current task before update:', currentTask);
      
      // 更新データをマージ
      const updatedTask = { ...currentTask, ...apiUpdates };
      
      // 期限の更新を明示的に処理
      if (updates.due !== undefined) {
        console.log(`Explicitly updating due date from ${currentTask.due} to ${updates.due}`);
        
        // Google Tasks APIの仕様に合わせて、dueプロパティを設定
        // RFC 3339形式の日付文字列である必要がある
        if (updates.due) {
          try {
            // 日付が有効かチェック
            const dueDate = new Date(updates.due);
            if (!isNaN(dueDate.getTime())) {
              // 有効な日付の場合、RFC 3339形式に変換
              updatedTask.due = dueDate.toISOString();
            } else {
              // 無効な日付の場合はそのまま使用
              updatedTask.due = updates.due;
            }
          } catch (dateError) {
            console.error('Error formatting due date:', dateError);
            // エラーが発生した場合はそのまま使用
            updatedTask.due = updates.due;
          }
        } else {
          // nullの場合は明示的にnullを設定
          updatedTask.due = null;
        }
      }
      
      // API Gateway経由でタスクを更新
      const response = await tasksApi.updateTask(taskListId, taskId, updatedTask);
      console.log('Update task response:', response);
      
      return response;
    } catch (error) {
      console.error('Tasks Service Error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * タスクのステータスを更新
   */
  static async updateTaskStatus(taskListId, taskId, completed) {
    try {
      console.log(`Updating task ${taskId} status to ${completed ? 'completed' : 'not completed'}`);
      
      // アクセストークンの確認
      const token = getAccessToken();
      if (!token) {
        throw new Error('アクセストークンがありません。再度ログインしてください。');
      }
      
      // 更新データを作成
      const updates = {
        status: completed ? 'completed' : 'needsAction',
        completed: completed ? new Date().toISOString() : null
      };
      
      // タスクを更新
      return await this.updateTask(taskListId, taskId, updates);
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }
  
  /**
   * タスクを削除
   */
  static async deleteTask(taskListId, taskId) {
    try {
      console.log(`Deleting task ${taskId} from list ${taskListId}`);
      
      // アクセストークンの確認
      const token = getAccessToken();
      if (!token) {
        throw new Error('アクセストークンがありません。再度ログインしてください。');
      }
      
      // API Gateway経由でタスクを削除
      await tasksApi.deleteTask(taskListId, taskId);
      console.log('Task deleted successfully');
      
      return true;
    } catch (error) {
      console.error('Tasks Service Error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * タスクの順序を更新
   */
  static async moveTask(taskListId, taskId, previousTaskId = null) {
    try {
      console.log(`Moving task ${taskId} in list ${taskListId} after ${previousTaskId || 'start'}`);
      
      // アクセストークンの確認
      const token = getAccessToken();
      if (!token) {
        throw new Error('アクセストークンがありません。再度ログインしてください。');
      }
      
      // API Gateway経由でタスクを移動
      const response = await tasksApi.moveTask(taskListId, taskId, previousTaskId);
      console.log('Move task response:', response);
      
      return response;
    } catch (error) {
      console.error('Tasks Service Error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

export default TasksService;
