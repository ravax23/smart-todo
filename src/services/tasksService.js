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
   * タスクリストを更新する
   * @param {string} taskListId - タスクリストのID
   * @param {Object} updates - 更新内容（title など）
   */
  static async updateTaskList(taskListId, updates) {
    try {
      console.log(`Updating task list: ${taskListId}`, updates);
      
      // アクセストークンの確認
      const token = getAccessToken();
      if (!token) {
        throw new Error('アクセストークンがありません。再度ログインしてください。');
      }
      
      // GAPIクライアントが初期化されているか確認
      if (window.gapi && window.gapi.client && window.gapi.client.tasks) {
        try {
          // 方法1: GAPIクライアントを使用
          console.log('Using GAPI client for API call');
          return await this.updateTaskListWithGapi(taskListId, updates);
        } catch (gapiError) {
          console.error('GAPI client error:', gapiError);
          // GAPIが失敗した場合は、fetchを使用する方法にフォールバック
        }
      }
      
      // 方法2: fetchを使用
      console.log('Using fetch for API call');
      return await this.updateTaskListWithFetch(taskListId, updates, token);
    } catch (error) {
      console.error('Tasks Service Error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * GAPIクライアントを使用してタスクリストを更新
   */
  static async updateTaskListWithGapi(taskListId, updates) {
    try {
      console.log('Calling tasks.tasklists.patch API with GAPI...');
      const response = await window.gapi.client.tasks.tasklists.patch({
        tasklist: taskListId,
        ...updates
      });
      
      console.log('GAPI Response:', response);
      
      if (response.status !== 200) {
        throw new Error(`Tasks API error: ${response.status} - ${response.statusText}`);
      }
      
      return response.result;
    } catch (error) {
      console.error('Error updating task list with GAPI:', error);
      throw error;
    }
  }
  
  /**
   * fetchを使用してタスクリストを更新
   */
  static async updateTaskListWithFetch(taskListId, updates, token) {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      console.log('Request Headers:', headers);

      const url = `https://tasks.googleapis.com/tasks/v1/users/@me/lists/${taskListId}`;
      console.log('Request URL:', url);

      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
      });

      console.log('API Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(`Tasks API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('API Response Data:', data);
      
      return data;
    } catch (error) {
      console.error('Error updating task list with fetch:', error);
      throw error;
    }
  }
  
  /**
   * タスクを別のリストに移動する
   * @param {string} taskId - タスクのID
   * @param {string} sourceListId - 元のタスクリストID
   * @param {string} targetListId - 移動先のタスクリストID
   */
  static async moveTask(taskId, sourceListId, targetListId) {
    try {
      console.log(`Moving task ${taskId} from list ${sourceListId} to list ${targetListId}`);
      
      // アクセストークンの確認
      const token = getAccessToken();
      if (!token) {
        throw new Error('アクセストークンがありません。再度ログインしてください。');
      }
      
      // 1. 元のリストからタスクを取得
      const task = await this.getTask(sourceListId, taskId);
      
      // 2. 移動先のリストに同じタスクを作成
      const newTask = await this.createTask(targetListId, {
        title: task.title,
        notes: task.notes,
        due: task.due,
        status: task.status
      });
      
      // 3. 元のリストからタスクを削除
      await this.deleteTask(sourceListId, taskId);
      
      return newTask;
    } catch (error) {
      console.error('Tasks Service Error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * 特定のタスクを取得
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
   * タスクを作成
   */
  static async createTask(taskListId, taskData) {
    try {
      console.log(`Creating task in list ${taskListId}`, taskData);
      
      // アクセストークンの確認
      const token = getAccessToken();
      if (!token) {
        throw new Error('アクセストークンがありません。再度ログインしてください。');
      }
      
      // GAPIクライアントが初期化されているか確認
      if (window.gapi && window.gapi.client && window.gapi.client.tasks) {
        try {
          const response = await window.gapi.client.tasks.tasks.insert({
            tasklist: taskListId,
            resource: taskData
          });
          
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
      
      const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`;
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(taskData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Tasks API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating task:', error);
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
          const response = await window.gapi.client.tasks.tasks.delete({
            tasklist: taskListId,
            task: taskId
          });
          
          if (response.status !== 204 && response.status !== 200) {
            throw new Error(`Tasks API error: ${response.status} - ${response.statusText}`);
          }
          
          return true;
        } catch (gapiError) {
          console.error('GAPI client error:', gapiError);
          // GAPIが失敗した場合は、fetchを使用する方法にフォールバック
        }
      }
      
      // fetchを使用
      const headers = {
        'Authorization': `Bearer ${token}`
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
      console.error('Error deleting task:', error);
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
