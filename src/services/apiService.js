/**
 * API Gateway経由でGoogle Tasks APIを呼び出すためのサービス
 */
import { getAccessToken } from './authService';
import { validateTaskListId, encodeTaskListId } from './tasksUtils';

// API GatewayのベースURL
// 環境変数から取得
export const API_BASE_URL = `${process.env.REACT_APP_API_GATEWAY_URL || ''}/api/tasks`;
export const API_GATEWAY_URL = process.env.REACT_APP_API_GATEWAY_URL || 'https://t3mexbcl3e.execute-api.us-east-1.amazonaws.com/prod';

/**
 * API Gatewayを通じてリクエストを送信する
 * @param {string} path - APIパス
 * @param {string} method - HTTPメソッド
 * @param {Object} data - リクエストボディ
 * @param {Object} params - クエリパラメータ
 * @returns {Promise<Object>} レスポンスデータ
 */
export const apiRequest = async (path, method = 'GET', data = null, params = {}) => {
  try {
    console.log('API Request - path:', path);
    console.log('API Request - method:', method);
    
    // アクセストークンの取得
    const token = getAccessToken();
    if (!token) {
      throw new Error('アクセストークンがありません。再度ログインしてください。');
    }

    // リクエストオプションの設定
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    };

    // リクエストボディの追加（必要な場合）
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    // クエリパラメータの追加（必要な場合）
    let url = `${API_BASE_URL}${path}`;
    if (Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      url = `${url}?${queryString}`;
    }

    console.log(`Sending ${method} request to: ${url}`);
    console.log(`Full request URL: ${url}`);
    console.log('Request options:', JSON.stringify(options));

    // リクエストの送信
    const response = await fetch(url, options);

    // レスポンスの処理
    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('Error response data:', errorData);
          errorMessage = errorData.error?.message || errorMessage;
        } else {
          // JSONでない場合はテキストとして読み込む
          const errorText = await response.text();
          console.error('Error response text:', errorText);
          errorMessage = `API error: ${response.status} - ${errorText}`;
        }
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      throw new Error(errorMessage);
    }

    // レスポンスデータの返却
    // まずContent-Typeをチェック
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        // JSONパースエラーの場合、レスポンスの内容をログに出力
        const responseText = await response.clone().text();
        console.error('Response that caused JSON parse error:', responseText);
        throw new Error(`JSONパースエラー: ${jsonError.message}`);
      }
    } else {
      // JSONでない場合はテキストとして返す
      const text = await response.text();
      console.log('Non-JSON response received:', text);
      return { text };
    }
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Google Tasks APIのエンドポイントを呼び出す
 */
export const tasksApi = {
  // タスクリスト関連
  getTaskLists: () => apiRequest('/tasks/v1/users/@me/lists'),
  createTaskList: (title) => apiRequest('/tasks/v1/users/@me/lists', 'POST', { title, kind: "tasks#taskList" }),
  getTaskList: (taskListId) => {
    const validId = validateTaskListId(taskListId);
    const encodedId = encodeURIComponent(validId);
    return apiRequest(`/tasks/v1/users/@me/lists/${encodedId}`);
  },
  updateTaskList: (taskListId, updates) => {
    console.log('API Service - updateTaskList called with ID:', taskListId);
    console.log('API Service - taskListId type:', typeof taskListId);
    console.log('API Service - updates:', updates);
    
    // タスクリストIDの検証
    const validId = validateTaskListId(taskListId);
    const encodedId = encodeURIComponent(validId);
    
    // 必須フィールドを追加
    const body = {
      ...updates,
      id: validId,
      kind: "tasks#taskList"
    };
    
    console.log('API Service - making request with:', {
      encodedId,
      body
    });
    
    return apiRequest(`/tasks/v1/users/@me/lists/${encodedId}`, 'PUT', body);
  },
  deleteTaskList: (taskListId) => {
    const validId = validateTaskListId(taskListId);
    const encodedId = encodeURIComponent(validId);
    return apiRequest(`/tasks/v1/users/@me/lists/${encodedId}`, 'DELETE');
  },

  // タスク関連
  getTasks: (taskListId, params = {}) => apiRequest(`/tasks/v1/lists/${taskListId}/tasks`, 'GET', null, params),
  getTask: (taskListId, taskId) => apiRequest(`/tasks/v1/lists/${taskListId}/tasks/${taskId}`),
  createTask: (taskListId, taskData) => apiRequest(`/tasks/v1/lists/${taskListId}/tasks`, 'POST', taskData),
  updateTask: (taskListId, taskId, updates) => {
    console.log(`API Service - updateTask called with taskId: ${taskId}, listId: ${taskListId}`);
    console.log('Updates:', updates);
    
    // スター属性を含む場合、それをログに出力
    if ('starred' in updates) {
      console.log(`Task ${taskId} star status being updated to: ${updates.starred}`);
    }
    
    return apiRequest(`/tasks/v1/lists/${taskListId}/tasks/${taskId}`, 'PUT', updates);
  },
  deleteTask: (taskListId, taskId) => apiRequest(`/tasks/v1/lists/${taskListId}/tasks/${taskId}`, 'DELETE'),
  moveTask: (taskListId, taskId, previousTaskId) => {
    const params = previousTaskId ? { previous: previousTaskId } : {};
    return apiRequest(`/tasks/v1/lists/${taskListId}/tasks/${taskId}/move`, 'POST', null, params);
  }
};

export default tasksApi;
