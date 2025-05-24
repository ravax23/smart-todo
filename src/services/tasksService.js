import { getAccessToken } from './authService';
import { gapi } from 'gapi-script';

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
      
      // アクセストークンの確認
      const token = getAccessToken();
      if (!token) {
        throw new Error('アクセストークンがありません。再度ログインしてください。');
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
                  console.log('Tasks API loaded successfully');
                  resolve();
                } catch (error) {
                  console.error('Failed to load tasks API:', error);
                  reject(error);
                }
              });
            });
          }
          
          // 方法1: GAPIクライアントを使用
          console.log('Using GAPI client for API call');
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
   * 特定のタスクリストのタスクを取得
   * @param {string} taskListId - タスクリストのID
   */
  static async getTasks(taskListId = '@default') {
    try {
      console.log(`Fetching tasks for list: ${taskListId}`);
      
      // アクセストークンの確認
      const token = getAccessToken();
      if (!token) {
        throw new Error('アクセストークンがありません。再度ログインしてください。');
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
                  console.log('Tasks API loaded successfully');
                  resolve();
                } catch (error) {
                  console.error('Failed to load tasks API:', error);
                  reject(error);
                }
              });
            });
          }
          
          // 方法1: GAPIクライアントを使用
          console.log('Using GAPI client for API call');
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
   * GAPIクライアントを使用してタスクリストを取得
   */
  static async getTaskListsWithGapi() {
    try {
      console.log('Calling tasks.tasklists.list API with GAPI...');
      const response = await window.gapi.client.tasks.tasklists.list({
        maxResults: 100
      });
      
      console.log('GAPI Response:', response);
      
      if (response.status !== 200) {
        throw new Error(`Tasks API error: ${response.status} - ${response.statusText}`);
      }
      
      return response.result.items || [];
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
      console.log('Request Headers:', headers);

      const url = 'https://tasks.googleapis.com/tasks/v1/users/@me/lists';
      console.log('Request URL:', url);

      const response = await fetch(url, {
        headers,
      });

      console.log('API Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(`Tasks API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('API Response Data:', data);
      
      return data.items || [];
    } catch (error) {
      console.error('Error fetching task lists with fetch:', error);
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
        showHidden: false,
        maxResults: 100
      });
      
      console.log('GAPI Response:', response);
      
      if (response.status !== 200) {
        throw new Error(`Tasks API error: ${response.status} - ${response.statusText}`);
      }
      
      return response.result.items ? response.result.items.map(this.convertTaskToTodo) : [];
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
      console.log('Request Headers:', headers);

      const params = new URLSearchParams({
        showCompleted: true,
        showHidden: false,
        maxResults: 100
      });

      const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks?${params}`;
      console.log('Request URL:', url);

      const response = await fetch(url, {
        headers,
      });

      console.log('API Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(`Tasks API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('API Response Data:', data);
      
      return data.items ? data.items.map(this.convertTaskToTodo) : [];
    } catch (error) {
      console.error('Error fetching tasks with fetch:', error);
      throw error;
    }
  }

  /**
   * GoogleタスクをTodoオブジェクトに変換
   * @param {Object} task - Googleタスク
   */
  static convertTaskToTodo(task) {
    return {
      id: task.id,
      title: task.title || '(タイトルなし)',
      description: task.notes || '',
      status: task.status || 'needsAction',
      startDate: task.due || '',
      created: task.updated || '',
      updated: task.updated || '',
      completed: task.completed || '',
      position: task.position || '',
      parent: task.parent || null,
      links: task.links || []
    };
  }
}

export default TasksService;
