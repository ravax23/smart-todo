import { getAccessToken } from './authService';
import { gapi } from 'gapi-script';
import { extractStarredStatus, setStarredStatus } from './tasksUtils';

/**
 * Google Tasks APIクライアント
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
      
      // iOS Safariを検出
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isIOSSafari = isIOS && isSafari;
      
      console.log('Browser detection in getTaskLists:', { 
        isIOS, 
        isSafari, 
        isIOSSafari, 
        userAgent: navigator.userAgent 
      });
      
      // iOS Safariの場合は直接fetchを使用
      if (isIOSSafari) {
        console.log('Using fetch for iOS Safari');
        return await this.getTaskListsWithFetch(token);
      }
      
      // GAPIクライアントが初期化されているか確認
      if (window.gapi && window.gapi.client) {
        try {
          // GAPIクライアントが初期化されていない場合は初期化
          if (!window.gapi.client.tasks) {
            console.log('Loading tasks API...');
            await new Promise((resolve, reject) => {
              window.gapi.load('client', async () => {
                try {
                  await window.gapi.client.load('tasks', 'v1');
                  resolve();
                } catch (error) {
                  reject(error);
                }
              });
            });
          }
          
          return await this.getTaskListsWithGapi();
        } catch (gapiError) {
          console.error('GAPI client error:', gapiError);
          // GAPIが失敗した場合は、fetchを使用する方法にフォールバック
        }
      }
      
      // 方法2: fetchを使用
      console.log('Using fetch for API call');
      return await this.getTaskListsWithFetch(token);
    } catch (error) {
      console.error('Tasks Service Error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * GAPIクライアントを使用してタスクリストを取得
   */
  static async getTaskListsWithGapi() {
    try {
      console.log('Calling tasks.tasklists.list API with GAPI...');
      const response = await window.gapi.client.tasks.tasklists.list();
      
      console.log('GAPI Response:', response);
      
      if (response.status !== 200) {
        throw new Error(`Tasks API error: ${response.status} - ${response.statusText}`);
      }
      
      const taskLists = response.result.items || [];
      
      // 各タスクリストを整形
      return taskLists.map(list => this.formatTaskList(list));
    } catch (error) {
      console.error('Error fetching task lists with GAPI:', error);
      throw error;
    }
  }
  
  /**
   * fetchを使用してタスクリストを取得
   */
  static async getTaskListsWithFetch(token) {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      
      const url = 'https://tasks.googleapis.com/tasks/v1/users/@me/lists';
      const response = await fetch(url, { headers });
      
      console.log('API Response Status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          // 401認証エラーの場合、ログイン状態をリセットして自動的にログアウト
          console.error('Authentication error (401) detected - Redirecting to login page');
          
          // ローカルストレージとセッションストレージからトークンを削除
          localStorage.removeItem('google_access_token');
          localStorage.removeItem('google_auth_token');
          localStorage.removeItem('google_user_info');
          sessionStorage.removeItem('google_access_token');
          sessionStorage.removeItem('google_auth_token');
          sessionStorage.removeItem('google_user_info');
          
          // 認証状態変更イベントを発行
          const authEvent = new CustomEvent('googleAuthStateChanged', { 
            detail: { isAuthenticated: false } 
          });
          window.dispatchEvent(authEvent);
          
          // 1秒後にページをリロード（ログイン画面に遷移）
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          
          throw new Error('認証情報が無効です。再度ログインしてください。');
        }
        
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('API Response Data:', data);
      
      const taskLists = data.items || [];
      
      // 各タスクリストを整形
      return taskLists.map(list => this.formatTaskList(list));
    } catch (error) {
      console.error('Error fetching task lists with fetch:', error);
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
      
      // GAPIクライアントが初期化されているか確認
      if (window.gapi && window.gapi.client && window.gapi.client.tasks) {
        try {
          return await this.createTaskListWithGapi(title);
        } catch (gapiError) {
          console.error('GAPI client error:', gapiError);
          // GAPIが失敗した場合は、fetchを使用する方法にフォールバック
        }
      }
      
      // 方法2: fetchを使用
      console.log('Using fetch for API call');
      return await this.createTaskListWithFetch(title, token);
    } catch (error) {
      console.error('Tasks Service Error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * GAPIクライアントを使用して新しいタスクリストを作成
   */
  static async createTaskListWithGapi(title) {
    try {
      console.log('Calling tasks.tasklists.insert API with GAPI...');
      const response = await window.gapi.client.tasks.tasklists.insert({
        title: title
      });
      
      console.log('GAPI Response:', response);
      
      if (response.status !== 200) {
        throw new Error(`Tasks API error: ${response.status} - ${response.statusText}`);
      }
      
      return response.result;
    } catch (error) {
      console.error('Error creating task list with GAPI:', error);
      throw error;
    }
  }
  
  /**
   * fetchを使用して新しいタスクリストを作成
   */
  static async createTaskListWithFetch(title, token) {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      
      const url = 'https://tasks.googleapis.com/tasks/v1/users/@me/lists';
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('API Response Data:', data);
      return data;
    } catch (error) {
      console.error('Error creating task list with fetch:', error);
      throw error;
    }
  }
  
  /**
   * タスクリストを更新
   */
  static async updateTaskList(taskListId, updates) {
    try {
      console.log(`Updating task list ${taskListId}:`, updates);
      
      // タスクリストIDの検証
      if (!taskListId || taskListId === 'undefined' || taskListId === 'null') {
        console.error('Invalid task list ID:', taskListId);
        throw new Error('Missing task list ID');
      }
      
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
      
      // 方法1: GAPIクライアントを使用
      if (window.gapi && window.gapi.client && window.gapi.client.tasks) {
        try {
          return await this.updateTaskListWithGapi(taskListId, updates);
        } catch (gapiError) {
          console.error('GAPI client error:', gapiError);
          console.log('Falling back to fetch method');
        }
      }
      
      // 方法2: fetchを使用
      console.log('Using fetch for API call');
      return await this.updateTaskListWithFetch(taskListId, updates, token);
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
   * GAPIクライアントを使用してタスクリストを更新
   */
  static async updateTaskListWithGapi(taskListId, updates) {
    try {
      console.log('Calling tasks.tasklists.update API with GAPI...');
      
      // タスクリストIDの検証
      if (!taskListId || taskListId === 'undefined' || taskListId === 'null') {
        console.error('Invalid task list ID in updateTaskListWithGapi:', taskListId);
        throw new Error('Missing task list ID');
      }
      
      // タスクリストIDをデコード（Base64エンコードされている可能性がある場合）
      let processedTaskListId = taskListId;
      
      console.log('Using taskListId for GAPI:', processedTaskListId);
      
      const response = await window.gapi.client.tasks.tasklists.update({
        tasklist: processedTaskListId,
        resource: updates
      });
      
      console.log('GAPI Response:', response);
      
      if (response.result) {
        return this.formatTaskList(response.result);
      } else {
        throw new Error('No result in GAPI response');
      }
    } catch (error) {
      console.error('GAPI updateTaskList error:', error);
      throw error;
    }
  }

  /**
   * fetchを使用してタスクリストを更新
   */
  static async updateTaskListWithFetch(taskListId, updates, token) {
    try {
      // タスクリストIDの検証
      if (!taskListId || taskListId === 'undefined' || taskListId === 'null') {
        console.error('Invalid task list ID in updateTaskListWithFetch:', taskListId);
        throw new Error('Missing task list ID');
      }
      
      // タスクリストIDをデコード（Base64エンコードされている可能性がある場合）
      let processedTaskListId = taskListId;
      
      // IDに特殊文字が含まれている場合に備えてエンコード
      const encodedTaskListId = encodeURIComponent(processedTaskListId);
      console.log('Original taskListId:', taskListId);
      console.log('Encoded taskListId:', encodedTaskListId);
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const url = `https://tasks.googleapis.com/tasks/v1/users/@me/lists/${encodedTaskListId}`;
      console.log('Update URL:', url);
      console.log('Update payload:', JSON.stringify(updates));
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: `;
        try {
          const errorData = await response.json();
          console.error('Update task list error response:', errorData);
          errorMessage += JSON.stringify(errorData);
        } catch (e) {
          const errorText = await response.text();
          errorMessage += errorText || response.statusText;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Fetch Response:', data);
      
      return this.formatTaskList(data);
    } catch (error) {
      console.error('Fetch updateTaskList error:', error);
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
    
    // IDを正規化（余分な空白や特殊文字を処理）
    const normalizedId = taskList.id.trim();
    
    // 必要なプロパティを抽出して返す
    return {
      id: normalizedId,
      title: taskList.title || 'Untitled',
      updated: taskList.updated || new Date().toISOString(),
      // その他必要なプロパティがあれば追加
    };
  }
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
      
      // GAPIクライアントが初期化されているか確認
      if (window.gapi && window.gapi.client && window.gapi.client.tasks) {
        try {
          console.log('Attempting to delete task list with GAPI...');
          const result = await this.deleteTaskListWithGapi(taskListId);
          console.log('Task list deleted successfully with GAPI');
          return result;
        } catch (gapiError) {
          console.error('GAPI client error:', gapiError);
          console.log('Falling back to fetch method for deletion');
        }
      }
      
      // 方法2: fetchを使用
      console.log('Using fetch for API call to delete task list');
      const result = await this.deleteTaskListWithFetch(taskListId, token);
      console.log('Task list deleted successfully with fetch');
      return result;
    } catch (error) {
      console.error('Tasks Service Error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * GAPIクライアントを使用してタスクリストを削除
   */
  static async deleteTaskListWithGapi(taskListId) {
    try {
      console.log('Calling tasks.tasklists.delete API with GAPI...');
      
      // タスクリストIDの検証
      if (!taskListId || taskListId === 'undefined' || taskListId === 'null') {
        console.error('Invalid task list ID in deleteTaskListWithGapi:', taskListId);
        throw new Error('Missing task list ID');
      }
      
      // タスクリストIDをデコード（Base64エンコードされている可能性がある場合）
      let processedTaskListId = taskListId;
      
      console.log('Using taskListId for GAPI delete:', processedTaskListId);
      
      const response = await window.gapi.client.tasks.tasklists.delete({
        tasklist: processedTaskListId
      });
      
      console.log('GAPI Response:', response);
      
      if (response.status !== 204 && response.status !== 200) {
        throw new Error(`Tasks API error: ${response.status} - ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting task list with GAPI:', error);
      throw error;
    }
  }
  
  /**
   * fetchを使用してタスクリストを削除
   */
  static async deleteTaskListWithFetch(taskListId, token) {
    try {
      // タスクリストIDの検証
      if (!taskListId || taskListId === 'undefined' || taskListId === 'null') {
        console.error('Invalid task list ID in deleteTaskListWithFetch:', taskListId);
        throw new Error('無効なタスクリストIDです。');
      }
      
      // タスクリストIDをデコード（Base64エンコードされている可能性がある場合）
      let processedTaskListId = taskListId;
      
      // IDに特殊文字が含まれている場合に備えてエンコード
      const encodedTaskListId = encodeURIComponent(processedTaskListId);
      console.log('Original taskListId for delete:', taskListId);
      console.log('Encoded taskListId for delete:', encodedTaskListId);
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      
      const url = `https://tasks.googleapis.com/tasks/v1/users/@me/lists/${encodedTaskListId}`;
      console.log('Delete URL:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        let errorMessage = `Tasks API error: ${response.status} - `;
        try {
          const errorData = await response.json();
          errorMessage += errorData.error?.message || 'Unknown error';
        } catch (e) {
          errorMessage += response.statusText || 'Unknown error';
        }
        console.error('Delete task list error response:', errorMessage);
        throw new Error(errorMessage);
      }
      
      console.log('Task list deleted successfully with fetch');
      return true;
    } catch (error) {
      console.error('Error deleting task list with fetch:', error);
      throw error;
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
  static async getTasks(taskListId) {
    try {
      console.log(`Fetching tasks from list ${taskListId}`);
      
      // アクセストークンの確認
      const token = getAccessToken();
      if (!token) {
        throw new Error('アクセストークンがありません。再度ログインしてください。');
      }
      
      // GAPIクライアントが初期化されているか確認
      if (window.gapi && window.gapi.client && window.gapi.client.tasks) {
        try {
          return await this.getTasksWithGapi(taskListId);
        } catch (gapiError) {
          console.error('GAPI client error:', gapiError);
          // GAPIが失敗した場合は、fetchを使用する方法にフォールバック
        }
      }
      
      // 方法2: fetchを使用
      console.log('Using fetch for API call');
      return await this.getTasksWithFetch(taskListId, token);
    } catch (error) {
      console.error('Tasks Service Error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * GAPIクライアントを使用してタスクを取得
   */
  static async getTasksWithGapi(taskListId) {
    try {
      console.log('Calling tasks.tasks.list API with GAPI...');
      const response = await window.gapi.client.tasks.tasks.list({
        tasklist: taskListId,
        showCompleted: true,
        showHidden: true,
        maxResults: 100
      });
      
      console.log('GAPI Response:', response);
      
      if (response.status !== 200) {
        throw new Error(`Tasks API error: ${response.status} - ${response.statusText}`);
      }
      
      return response.result.items || [];
    } catch (error) {
      console.error('Error fetching tasks with GAPI:', error);
      throw error;
    }
  }
  
  /**
   * fetchを使用してタスクを取得
   */
  static async getTasksWithFetch(taskListId, token) {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      
      const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks?showCompleted=true&showHidden=true&maxResults=100`;
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Tasks API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching tasks with fetch:', error);
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
      
      // GAPIクライアントが初期化されているか確認
      if (window.gapi && window.gapi.client && window.gapi.client.tasks) {
        try {
          return await this.createTaskWithGapi(taskListId, apiTaskData);
        } catch (gapiError) {
          console.error('GAPI client error:', gapiError);
          // GAPIが失敗した場合は、fetchを使用する方法にフォールバック
        }
      }
      
      // 方法2: fetchを使用
      console.log('Using fetch for API call');
      return await this.createTaskWithFetch(taskListId, apiTaskData, token);
    } catch (error) {
      console.error('Tasks Service Error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * GAPIクライアントを使用して新しいタスクを作成
   */
  static async createTaskWithGapi(taskListId, taskData) {
    try {
      console.log('Calling tasks.tasks.insert API with GAPI...', JSON.stringify(taskData, null, 2));
      
      // スター状態を適切なプロパティに設定
      let apiTaskData = { ...taskData };
      if ('starred' in taskData) {
        apiTaskData = setStarredStatus(apiTaskData, taskData.starred);
      }
      
      // Google Tasks APIの仕様に合わせてリクエストを構築
      const request = {
        tasklist: taskListId,
        // 以下のプロパティを明示的に指定
        resource: {
          title: apiTaskData.title,
          notes: apiTaskData.notes || '',
          due: apiTaskData.due,
          status: apiTaskData.status || 'needsAction',
          // スター関連のプロパティを明示的に設定（priorityのみ）
          priority: apiTaskData.priority
        }
      };
      
      console.log('Final GAPI create request:', JSON.stringify(request, null, 2));
      
      const response = await window.gapi.client.tasks.tasks.insert(request);
      
      console.log('GAPI Create Response:', response);
      
      if (response.status !== 200) {
        throw new Error(`Tasks API error: ${response.status} - ${response.statusText}`);
      }
      
      return response.result;
    } catch (error) {
      console.error('Error creating task with GAPI:', error);
      throw error;
    }
  }
  
  /**
   * fetchを使用して新しいタスクを作成
   */
  static async createTaskWithFetch(taskListId, taskData, token) {
    try {
      console.log('Creating task with fetch:', JSON.stringify(taskData, null, 2));
      
      // スター状態を適切なプロパティに設定
      let apiTaskData = { ...taskData };
      if ('starred' in taskData) {
        apiTaskData = setStarredStatus(apiTaskData, taskData.starred);
      }
      
      // Google Tasks APIの仕様に合わせてリクエストボディを構築
      const requestBody = {
        title: apiTaskData.title,
        notes: apiTaskData.notes || '',
        due: apiTaskData.due,
        status: apiTaskData.status || 'needsAction',
        // スター関連のプロパティを明示的に設定（priorityのみ）
        priority: apiTaskData.priority
      };
      
      console.log('Final fetch create request body:', JSON.stringify(requestBody, null, 2));
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      
      const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`;
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Tasks API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const responseData = await response.json();
      console.log('Fetch create response data:', JSON.stringify(responseData, null, 2));
      return responseData;
    } catch (error) {
      console.error('Error creating task with fetch:', error);
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
      
      // GAPIクライアントが初期化されているか確認
      if (window.gapi && window.gapi.client && window.gapi.client.tasks) {
        try {
          const response = await window.gapi.client.tasks.tasks.get({
            tasklist: taskListId,
            task: taskId
          });
          
          console.log('GAPI Response:', response);
          
          if (response.status !== 200) {
            throw new Error(`Tasks API error: ${response.status} - ${response.statusText}`);
          }
          
          return response.result;
        } catch (gapiError) {
          console.error('GAPI client error:', gapiError);
          // GAPIが失敗した場合は、fetchを使用する方法にフォールバック
        }
      }
      
      // fetchを使用
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      
      const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`;
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Tasks API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
      
      return await response.json();
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
      
      // GAPIクライアントが初期化されているか確認
      if (window.gapi && window.gapi.client && window.gapi.client.tasks) {
        try {
          return await this.updateTaskWithGapi(taskListId, taskId, apiUpdates);
        } catch (gapiError) {
          console.error('GAPI client error:', gapiError);
          // GAPIが失敗した場合は、fetchを使用する方法にフォールバック
        }
      }
      
      // 方法2: fetchを使用
      console.log('Using fetch for API call');
      return await this.updateTaskWithFetch(taskListId, taskId, apiUpdates, token);
    } catch (error) {
      console.error('Tasks Service Error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * GAPIクライアントを使用してタスクを更新
   */
  static async updateTaskWithGapi(taskListId, taskId, updates) {
    try {
      // 現在のタスクを取得
      const currentTask = await this.getTask(taskListId, taskId);
      console.log('Current task before update:', JSON.stringify(currentTask, null, 2));
      
      // 更新データをマージ
      const updatedTask = { ...currentTask };
      
      // 明示的に各フィールドを更新
      if (updates.title !== undefined) updatedTask.title = updates.title;
      if (updates.notes !== undefined) updatedTask.notes = updates.notes || '';
      
      // 期限の更新を明示的に処理
      if (updates.due !== undefined) {
        console.log(`Explicitly updating due date from ${currentTask.due} to ${updates.due}`);
        updatedTask.due = updates.due;
        
        // Google Tasks APIの仕様に合わせて、dueプロパティを設定
        // RFC 3339形式の日付文字列である必要がある
        if (updates.due) {
          try {
            // 日付が有効かチェック
            const dueDate = new Date(updates.due);
            if (!isNaN(dueDate.getTime())) {
              // 有効な日付の場合、RFC 3339形式に変換
              updatedTask.due = dueDate.toISOString();
            }
          } catch (dateError) {
            console.error('Error formatting due date:', dateError);
          }
        } else {
          // nullの場合は明示的にnullを設定
          updatedTask.due = null;
        }
      }
      
      if (updates.status !== undefined) updatedTask.status = updates.status;
      if (updates.completed !== undefined) updatedTask.completed = updates.completed;
      
      // スター状態を適切に設定
      if ('starred' in updates) {
        // スター状態を直接設定せず、priorityプロパティを使用
        updatedTask.priority = updates.starred ? 'high' : 'normal';
        console.log(`Setting priority to ${updatedTask.priority} based on starred=${updates.starred}`);
      }
      
      console.log('Calling tasks.tasks.update API with GAPI...', JSON.stringify(updatedTask, null, 2));
      
      // Google Tasks APIの仕様に合わせてリクエストを構築
      const request = {
        tasklist: taskListId,
        task: taskId,
        resource: updatedTask
      };
      
      console.log('Final GAPI request:', JSON.stringify(request, null, 2));
      
      const response = await window.gapi.client.tasks.tasks.update(request);
      
      console.log('GAPI Response:', response);
      
      if (response.status !== 200) {
        throw new Error(`Tasks API error: ${response.status} - ${response.statusText}`);
      }
      
      return response.result;
    } catch (error) {
      console.error('Error updating task with GAPI:', error);
      throw error;
    }
  }
  
  /**
   * fetchを使用してタスクを更新
   */
  static async updateTaskWithFetch(taskListId, taskId, updates, token) {
    try {
      // 現在のタスクを取得
      const currentTask = await this.getTask(taskListId, taskId);
      console.log('Current task before update:', JSON.stringify(currentTask, null, 2));
      
      // 更新データをマージ
      const updatedTask = { ...currentTask };
      
      // 明示的に各フィールドを更新
      if (updates.title !== undefined) updatedTask.title = updates.title;
      if (updates.notes !== undefined) updatedTask.notes = updates.notes || '';
      
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
      
      if (updates.status !== undefined) updatedTask.status = updates.status;
      if (updates.completed !== undefined) updatedTask.completed = updates.completed;
      
      // スター状態を適切に設定
      if ('starred' in updates) {
        // スター状態を直接設定せず、priorityプロパティを使用
        updatedTask.priority = updates.starred ? 'high' : 'normal';
        console.log(`Setting priority to ${updatedTask.priority} based on starred=${updates.starred}`);
      }
      
      console.log('Updating task with fetch:', JSON.stringify(updatedTask, null, 2));
      
      // Google Tasks APIの仕様に合わせてリクエストボディを構築
      // 現在のタスクデータをそのまま使用し、必要なフィールドのみを更新
      const requestBody = updatedTask;
      
      console.log('Final fetch request body:', JSON.stringify(requestBody, null, 2));
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      
      const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Tasks API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const responseData = await response.json();
      console.log('Fetch response data:', JSON.stringify(responseData, null, 2));
      return responseData;
    } catch (error) {
      console.error('Error updating task with fetch:', error);
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
      
      // 現在のタスクを取得
      const currentTask = await this.getTask(taskListId, taskId);
      
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
      
      // GAPIクライアントが初期化されているか確認
      if (window.gapi && window.gapi.client && window.gapi.client.tasks) {
        try {
          return await this.deleteTaskWithGapi(taskListId, taskId);
        } catch (gapiError) {
          console.error('GAPI client error:', gapiError);
          // GAPIが失敗した場合は、fetchを使用する方法にフォールバック
        }
      }
      
      // 方法2: fetchを使用
      console.log('Using fetch for API call');
      return await this.deleteTaskWithFetch(taskListId, taskId, token);
    } catch (error) {
      console.error('Tasks Service Error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * GAPIクライアントを使用してタスクを削除
   */
  static async deleteTaskWithGapi(taskListId, taskId) {
    try {
      console.log('Calling tasks.tasks.delete API with GAPI...');
      const response = await window.gapi.client.tasks.tasks.delete({
        tasklist: taskListId,
        task: taskId
      });
      
      console.log('GAPI Response:', response);
      
      if (response.status !== 204 && response.status !== 200) {
        throw new Error(`Tasks API error: ${response.status} - ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting task with GAPI:', error);
      throw error;
    }
  }
  
  /**
   * fetchを使用してタスクを削除
   */
  static async deleteTaskWithFetch(taskListId, taskId, token) {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      
      const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Tasks API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting task with fetch:', error);
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
      
      // GAPIクライアントが初期化されているか確認
      if (window.gapi && window.gapi.client && window.gapi.client.tasks) {
        try {
          return await this.moveTaskWithGapi(taskListId, taskId, previousTaskId);
        } catch (gapiError) {
          console.error('GAPI client error:', gapiError);
          // GAPIが失敗した場合は、fetchを使用する方法にフォールバック
        }
      }
      
      // 方法2: fetchを使用
      console.log('Using fetch for API call');
      return await this.moveTaskWithFetch(taskListId, taskId, previousTaskId, token);
    } catch (error) {
      console.error('Tasks Service Error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * GAPIクライアントを使用してタスクを移動
   */
  static async moveTaskWithGapi(taskListId, taskId, previousTaskId) {
    try {
      console.log('Calling tasks.tasks.move API with GAPI...');
      const params = {
        tasklist: taskListId,
        task: taskId
      };
      
      if (previousTaskId) {
        params.previous = previousTaskId;
      }
      
      const response = await window.gapi.client.tasks.tasks.move(params);
      
      console.log('GAPI Response:', response);
      
      if (response.status !== 200) {
        throw new Error(`Tasks API error: ${response.status} - ${response.statusText}`);
      }
      
      return response.result;
    } catch (error) {
      console.error('Error moving task with GAPI:', error);
      throw error;
    }
  }
  
  /**
   * fetchを使用してタスクを移動
   */
  static async moveTaskWithFetch(taskListId, taskId, previousTaskId, token) {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      
      let url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}/move`;
      if (previousTaskId) {
        url += `?previous=${previousTaskId}`;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Tasks API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error moving task with fetch:', error);
      throw error;
    }
  }
}

export default TasksService;
