/**
 * API Gateway経由でGoogle Tasks APIを呼び出すためのサービス
 */
import { getAccessToken } from './authService';

// API GatewayのベースURL
// 環境変数から取得
const API_BASE_URL = `${process.env.REACT_APP_API_GATEWAY_URL || ''}/api/tasks`;

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

    // リクエストの送信
    const response = await fetch(url, options);

    // レスポンスの処理
    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorMessage;
        } else {
          // JSONでない場合はテキストとして読み込む
          const errorText = await response.text();
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
  createTaskList: (title) => apiRequest('/tasks/v1/users/@me/lists', 'POST', { title }),
  getTaskList: (taskListId) => apiRequest(`/tasks/v1/lists/${taskListId}`),
  updateTaskList: (taskListId, updates) => apiRequest(`/tasks/v1/lists/${taskListId}`, 'PUT', updates),
  deleteTaskList: (taskListId) => apiRequest(`/tasks/v1/lists/${taskListId}`, 'DELETE'),

  // タスク関連
  getTasks: (taskListId, params = {}) => apiRequest(`/tasks/v1/lists/${taskListId}/tasks`, 'GET', null, params),
  getTask: (taskListId, taskId) => apiRequest(`/tasks/v1/lists/${taskListId}/tasks/${taskId}`),
  createTask: (taskListId, taskData) => apiRequest(`/tasks/v1/lists/${taskListId}/tasks`, 'POST', taskData),
  updateTask: (taskListId, taskId, updates) => apiRequest(`/tasks/v1/lists/${taskListId}/tasks/${taskId}`, 'PUT', updates),
  deleteTask: (taskListId, taskId) => apiRequest(`/tasks/v1/lists/${taskListId}/tasks/${taskId}`, 'DELETE'),
  moveTask: (taskListId, taskId, previousTaskId) => {
    const params = previousTaskId ? { previous: previousTaskId } : {};
    return apiRequest(`/tasks/v1/lists/${taskListId}/tasks/${taskId}/move`, 'POST', null, params);
  }
};

export default tasksApi;
