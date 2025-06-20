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
      
      // アクセストークンの確認
      const token = getAccessToken();
      console.log('Access token available:', !!token);
      
      if (!token) {
        console.error('Access token not found');
        throw new Error('アクセストークンがありません。再度ログインしてください。');
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
      
      const url = 'https://tasks.googleapis.com/tasks/v1/users/@me/lists';
      const response = await fetch(url, { headers });
      
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
        'Content-Type': 'application/json',
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
      console.log('Current task before update:', currentTask);
      
      // 更新データをマージ
      const updatedTask = { ...currentTask };
      
      // 明示的に各フィールドを更新
      if (updates.title !== undefined) updatedTask.title = updates.title;
      if (updates.notes !== undefined) updatedTask.notes = updates.notes || '';
      if (updates.due !== undefined) updatedTask.due = updates.due;
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
      console.log('Current task before update:', currentTask);
      
      // 更新データをマージ
      const updatedTask = { ...currentTask };
      
      // 明示的に各フィールドを更新
      if (updates.title !== undefined) updatedTask.title = updates.title;
      if (updates.notes !== undefined) updatedTask.notes = updates.notes || '';
      if (updates.due !== undefined) updatedTask.due = updates.due;
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
