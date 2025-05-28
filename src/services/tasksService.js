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
        // キャッシュを無効化
        cache: 'no-store',
      });

      console.log('API Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
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
      console.log('Request Headers:', headers);

      const url = 'https://tasks.googleapis.com/tasks/v1/users/@me/lists';
      console.log('Request URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title })
      });

      console.log('API Response Status:', response.status);

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
   * タスクリストを削除
   */
  static async deleteTaskList(taskListId) {
    try {
      console.log(`Deleting task list ${taskListId}`);
      
      // アクセストークンの確認
      const token = getAccessToken();
      if (!token) {
        throw new Error('アクセストークンがありません。再度ログインしてください。');
      }
      
      // GAPIクライアントが初期化されているか確認
      if (window.gapi && window.gapi.client && window.gapi.client.tasks) {
        try {
          return await this.deleteTaskListWithGapi(taskListId);
        } catch (gapiError) {
          console.error('GAPI client error:', gapiError);
          // GAPIが失敗した場合は、fetchを使用する方法にフォールバック
        }
      }
      
      // 方法2: fetchを使用
      console.log('Using fetch for API call');
      return await this.deleteTaskListWithFetch(taskListId, token);
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
      const response = await window.gapi.client.tasks.tasklists.delete({
        tasklist: taskListId
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
      const headers = {
        'Authorization': `Bearer ${token}`,
      };
      
      const url = `https://tasks.googleapis.com/tasks/v1/users/@me/lists/${taskListId}`;
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
      console.error('Error deleting task list with fetch:', error);
      throw error;
    }
  }
  
  /**
   * タスクリストを更新
   */
  static async updateTaskList(taskListId, updates) {
    try {
      console.log(`Updating task list ${taskListId}:`, updates);
      
      // アクセストークンの確認
      const token = getAccessToken();
      if (!token) {
        throw new Error('アクセストークンがありません。再度ログインしてください。');
      }
      
      // GAPIクライアントが初期化されているか確認
      if (window.gapi && window.gapi.client && window.gapi.client.tasks) {
        try {
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
      
      const url = `https://tasks.googleapis.com/tasks/v1/users/@me/lists/${taskListId}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Tasks API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating task list with fetch:', error);
      throw error;
    }
  }
  
  /**
   * タスクリストのタスク一覧を取得
   */
  static async getTasks(taskListId) {
    try {
      console.log(`Fetching tasks for list ${taskListId}`);
      
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
   * GAPIクライアントを使用してタスク一覧を取得
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
      
      // デバッグ用：タスクのpositionとタイトルをログ出力
      const items = response.result.items || [];
      console.log('Tasks with positions (GAPI):', items.map(item => ({
        title: item.title,
        position: item.position
      })));
      
      // positionプロパティでソート
      return items.sort((a, b) => {
        const posA = a.position || '';
        const posB = b.position || '';
        return posA.localeCompare(posB, undefined, { numeric: true, sensitivity: 'base' });
      });
    } catch (error) {
      console.error('Error fetching tasks with GAPI:', error);
      throw error;
    }
  }
  
  /**
   * fetchを使用してタスク一覧を取得
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
      const items = data.items || [];
      
      // デバッグ用：タスクのpositionとタイトルをログ出力
      console.log('Tasks with positions (fetch):', items.map(item => ({
        title: item.title,
        position: item.position
      })));
      
      // positionプロパティでソート
      return items.sort((a, b) => {
        const posA = a.position || '';
        const posB = b.position || '';
        return posA.localeCompare(posB, undefined, { numeric: true, sensitivity: 'base' });
      });
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
      
      // GAPIクライアントが初期化されているか確認
      if (window.gapi && window.gapi.client && window.gapi.client.tasks) {
        try {
          return await this.createTaskWithGapi(taskListId, taskData);
        } catch (gapiError) {
          console.error('GAPI client error:', gapiError);
          // GAPIが失敗した場合は、fetchを使用する方法にフォールバック
        }
      }
      
      // 方法2: fetchを使用
      console.log('Using fetch for API call');
      return await this.createTaskWithFetch(taskListId, taskData, token);
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
      console.log('Calling tasks.tasks.insert API with GAPI...');
      const response = await window.gapi.client.tasks.tasks.insert({
        tasklist: taskListId,
        ...taskData
      });
      
      console.log('GAPI Response:', response);
      
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
          
          console.log('GAPI Response:', response);
          
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
        'Authorization': `Bearer ${token}`,
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
      
      // GAPIクライアントが初期化されているか確認
      if (window.gapi && window.gapi.client && window.gapi.client.tasks) {
        try {
          return await this.updateTaskWithGapi(taskListId, taskId, updates);
        } catch (gapiError) {
          console.error('GAPI client error:', gapiError);
          // GAPIが失敗した場合は、fetchを使用する方法にフォールバック
        }
      }
      
      // 方法2: fetchを使用
      console.log('Using fetch for API call');
      return await this.updateTaskWithFetch(taskListId, taskId, updates, token);
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
      
      // 更新データをマージ
      const updatedTask = { ...currentTask, ...updates };
      
      console.log('Calling tasks.tasks.update API with GAPI...');
      const response = await window.gapi.client.tasks.tasks.update({
        tasklist: taskListId,
        task: taskId,
        ...updatedTask
      });
      
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
      
      // 更新データをマージ
      const updatedTask = { ...currentTask, ...updates };
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      
      const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updatedTask)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Tasks API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating task with fetch:', error);
      throw error;
    }
  }
  
  /**
   * タスクのステータスを更新
   */
  static async updateTaskStatus(taskListId, taskId, status) {
    return await this.updateTask(taskListId, taskId, { status });
  }
  
  /**
   * タスクを別のリストに移動
   */
  static async moveTask(taskId, sourceListId, targetListId) {
    try {
      console.log(`Moving task ${taskId} from list ${sourceListId} to list ${targetListId}`);
      
      // 元のタスクを取得
      const task = await this.getTask(sourceListId, taskId);
      
      // 新しいリストにタスクを作成
      const newTask = await this.createTask(targetListId, {
        title: task.title,
        notes: task.notes,
        due: task.due,
        status: task.status
      });
      
      // 元のタスクを削除
      await this.deleteTask(sourceListId, taskId);
      
      return newTask;
    } catch (error) {
      console.error('Error moving task between lists:', error);
      throw error;
    }
  }
  
  /**
   * リスト内でタスクの順序を変更
   */
  static async moveTaskInList(taskListId, taskId, previousTaskId = null) {
    try {
      console.log(`Moving task ${taskId} in list ${taskListId}, after task ${previousTaskId || 'START'}`);
      
      // アクセストークンの確認
      const token = getAccessToken();
      if (!token) {
        throw new Error('アクセストークンがありません。再度ログインしてください。');
      }
      
      // GAPIクライアントが初期化されているか確認
      if (window.gapi && window.gapi.client && window.gapi.client.tasks) {
        try {
          const response = await window.gapi.client.tasks.tasks.move({
            tasklist: taskListId,
            task: taskId,
            previous: previousTaskId || undefined
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
      console.error('Error moving task in list:', error);
      throw error;
    }
  }
}

export default TasksService;
