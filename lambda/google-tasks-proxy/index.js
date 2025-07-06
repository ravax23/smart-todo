const axios = require('axios');
const AWS = require('aws-sdk');

// DynamoDBクライアントの初期化
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const STARRED_TASKS_TABLE = 'SmartTodoStarredTasks';

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event));
  
  // CORS headers - すべてのレスポンスに適用
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token, X-Requested-With',
    'Content-Type': 'application/json'
  };
  
  // OPTIONSリクエストの処理
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight request successful' })
    };
  }
  
  try {
    // リクエスト情報を取得
    const originalPath = event.path;
    const path = originalPath.replace('/api/tasks', '');
    const method = event.httpMethod;
    const queryParams = event.queryStringParameters || {};
    const body = event.body ? JSON.parse(event.body) : undefined;
    
    console.log('Request details:', {
      originalPath,
      processedPath: path,
      method,
      queryParams,
      bodyKeys: body ? Object.keys(body) : 'none'
    });
    
    // 認証ヘッダーの取得
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      console.log('Missing Authorization header');
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header is required' })
      };
    }
    
    // ユーザーIDを取得（トークンからユーザー情報を抽出）
    const userId = await getUserIdFromToken(authHeader);
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token or unable to extract user ID' })
      };
    }
    
    console.log(`User ID: ${userId}`);
    
    
    console.log(`Making ${method} request to: https://tasks.googleapis.com${path}`);
    
    // Google Tasks APIにリクエストを転送
    const response = await axios({
      method: method,
      url: `https://tasks.googleapis.com${path}`,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      params: queryParams,
      data: body,
      validateStatus: () => true // すべてのステータスコードを許可
    });
    
    console.log('Google Tasks API response status:', response.status);
    
    // タスク取得時の処理（スター情報を追加）
    if (method === 'GET' && path.match(/^\/tasks\/v1\/lists\/[^\/]+\/tasks$/)) {
      if (response.status === 200 && response.data && response.data.items) {
        try {
          // DynamoDBからスター情報を取得
          const starredTasks = await getStarredTasks(userId);
          const starredTaskIds = starredTasks.map(item => item.taskId);
          
          console.log(`Adding star information to ${response.data.items.length} tasks`);
          console.log(`User ${userId} has ${starredTaskIds.length} starred tasks`);
          
          // タスクデータにスター情報を追加
          response.data.items = response.data.items.map(task => {
            const isStarred = starredTaskIds.includes(task.id);
            if (isStarred) {
              console.log(`Task ${task.id} is starred`);
            }
            return {
              ...task,
              starred: isStarred
            };
          });
        } catch (starError) {
          console.error('Error adding star information to tasks:', starError);
          // エラーを無視して続行
        }
      }
    }
    
    // タスク取得時の処理（スター情報を追加）
    if (method === 'GET' && path.match(/^\/tasks\/v1\/lists\/[^\/]+\/tasks$/)) {
      if (response.status === 200 && response.data && response.data.items) {
        try {
          // DynamoDBからスター情報を取得
          const starredTasks = await getStarredTasks(userId);
          const starredTaskIds = starredTasks.map(item => item.taskId);
          
          console.log(`Adding star information to ${response.data.items.length} tasks`);
          console.log(`User ${userId} has ${starredTaskIds.length} starred tasks`);
          
          // タスクデータにスター情報を追加
          response.data.items = response.data.items.map(task => {
            const isStarred = starredTaskIds.includes(task.id);
            if (isStarred) {
              console.log(`Task ${task.id} is starred`);
            }
            return {
              ...task,
              starred: isStarred
            };
          });
        } catch (starError) {
          console.error('Error adding star information to tasks:', starError);
          // エラーを無視して続行
        }
      }
    }
    
    // タスク更新時の処理（スター情報を処理）
    if (method === 'PUT' && path.match(/^\/tasks\/v1\/lists\/[^\/]+\/tasks\/[^\/]+$/)) {
      const pathParts = path.split('/');
      const listId = pathParts[4];
      const taskId = pathParts[6];
      
      // スター属性の処理
      if (body && 'starred' in body) {
        const isStarred = !!body.starred;
        try {
          console.log(`Updating star status for task ${taskId} to ${isStarred}`);
          // タスクのスター状態を更新
          await updateStarredTask(userId, taskId, listId, isStarred);
          console.log(`Star status updated for task ${taskId}`);
        } catch (starError) {
          console.error('Error updating star status:', starError);
          // エラーを無視して続行
        }
      }
    }
    
    // タスク削除時の処理
    if (method === 'DELETE' && path.match(/^\/tasks\/v1\/lists\/[^\/]+\/tasks\/[^\/]+$/)) {
      const pathParts = path.split('/');
      const listId = pathParts[4];
      const taskId = pathParts[6];
      
      try {
        // DynamoDBからスター情報も削除
        await deleteStarredTask(userId, taskId);
        console.log(`Deleted star information for task ${taskId}`);
      } catch (deleteError) {
        console.error(`Error deleting star information for task ${taskId}:`, deleteError);
        // エラーを無視して続行
      }
    }
    
    // タスクリスト削除時の処理
    if (method === 'DELETE' && path.match(/^\/tasks\/v1\/users\/@me\/lists\/[^\/]+$/)) {
      const listId = path.split('/')[5];
      
      try {
        // このリストに関連するすべてのスター情報を削除
        await deleteStarredTasksByList(userId, listId);
        console.log(`Deleted star information for all tasks in list ${listId}`);
      } catch (deleteError) {
        console.error(`Error deleting star information for list ${listId}:`, deleteError);
        // エラーを無視して続行
      }
    }
    
    // レスポンスデータの検証
    let responseBody;
    if (response.data) {
      try {
        // データがオブジェクトの場合はJSON文字列に変換
        if (typeof response.data === 'object') {
          responseBody = JSON.stringify(response.data);
        } else if (typeof response.data === 'string') {
          // 文字列の場合は有効なJSONかチェック
          JSON.parse(response.data); // 検証のみ
          responseBody = response.data;
        } else {
          // その他の型の場合は文字列に変換
          responseBody = JSON.stringify({ data: String(response.data) });
        }
      } catch (jsonError) {
        console.error('Error parsing response data:', jsonError);
        responseBody = JSON.stringify({ 
          data: typeof response.data === 'string' ? response.data : String(response.data),
          warning: 'Response data could not be parsed as JSON'
        });
      }
    } else {
      responseBody = JSON.stringify({ data: null });
    }
    
    // レスポンスを返す
    return {
      statusCode: response.status,
      headers,
      body: responseBody
    };
  } catch (error) {
    console.error('Error processing request:', error);
    
    // エラーレスポンスの処理
    const statusCode = error.response?.status || 500;
    const errorData = error.response?.data || { error: 'Internal Server Error', message: error.message };
    
    return {
      statusCode,
      headers,
      body: JSON.stringify(errorData)
    };
  }
};

/**
 * トークンからユーザーIDを抽出する
 * @param {string} authHeader - 認証ヘッダー
 * @returns {Promise<string>} ユーザーID
 */
async function getUserIdFromToken(authHeader) {
  try {
    // Bearer トークンを抽出
    const token = authHeader.replace('Bearer ', '');
    
    // Google OAuth2 トークン情報エンドポイントを呼び出し
    const response = await axios({
      method: 'GET',
      url: 'https://www.googleapis.com/oauth2/v3/userinfo',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // ユーザーIDを返す
    return response.data.sub || response.data.email;
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
}

/**
 * スター付きタスクを更新
 * @param {string} userId - ユーザーID
 * @param {string} taskId - タスクID
 * @param {string} listId - リストID
 * @param {boolean} isStarred - スター状態
 * @returns {Promise<Object>} 更新結果
 */
async function updateStarredTask(userId, taskId, listId, isStarred) {
  try {
    const timestamp = new Date().toISOString();
    
    if (isStarred) {
      // スターを付ける場合は項目を作成/更新
      const params = {
        TableName: STARRED_TASKS_TABLE,
        Item: {
          userId,
          taskId,
          listId,
          isStarred: true,
          updatedAt: timestamp,
          createdAt: timestamp
        }
      };
      
      console.log(`Adding star for task ${taskId} in list ${listId} for user ${userId}`);
      console.log('DynamoDB params:', JSON.stringify(params));
      
      await dynamoDB.put(params).promise();
      return { userId, taskId, listId, isStarred: true };
    } else {
      // スターを外す場合は項目を削除
      const params = {
        TableName: STARRED_TASKS_TABLE,
        Key: {
          userId,
          taskId
        }
      };
      
      console.log(`Removing star for task ${taskId} for user ${userId}`);
      console.log('DynamoDB params:', JSON.stringify(params));
      
      await dynamoDB.delete(params).promise();
      return { userId, taskId, isStarred: false };
    }
  } catch (error) {
    console.error(`Error updating starred task ${taskId} for user ${userId}:`, error);
    throw new Error(`Failed to update starred task: ${error.message}`);
  }
}

/**
 * スター付きタスクの一覧を取得
 * @param {string} userId - ユーザーID
 * @returns {Promise<Array>} スター付きタスクの配列
 */
async function getStarredTasks(userId) {
  try {
    console.log(`Getting starred tasks for user ${userId}`);
    console.log(`Using DynamoDB table: ${STARRED_TASKS_TABLE}`);
    
    const params = {
      TableName: STARRED_TASKS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };
    
    console.log('DynamoDB query params:', JSON.stringify(params));
    
    try {
      const result = await dynamoDB.query(params).promise();
      console.log(`Found ${result.Items?.length || 0} starred tasks for user ${userId}`);
      
      // 詳細なログを追加
      if (result.Items && result.Items.length > 0) {
        result.Items.forEach((item, index) => {
          console.log(`Starred task ${index + 1}: taskId=${item.taskId}, listId=${item.listId}`);
        });
      }
      
      return result.Items || [];
    } catch (dbError) {
      console.error('DynamoDB query error:', dbError);
      // エラーを再スローせず、空の配列を返す
      return [];
    }
  } catch (error) {
    console.error(`Error getting starred tasks for user ${userId}:`, error);
    // エラーを再スローせず、空の配列を返す
    return [];
  }
}

/**
 * スター付きタスクを削除
 * @param {string} userId - ユーザーID
 * @param {string} taskId - タスクID
 * @returns {Promise<void>}
 */
async function deleteStarredTask(userId, taskId) {
  try {
    console.log(`Deleting star information for task ${taskId} for user ${userId}`);
    
    const params = {
      TableName: STARRED_TASKS_TABLE,
      Key: {
        userId,
        taskId
      }
    };
    
    console.log('DynamoDB delete params:', JSON.stringify(params));
    
    await dynamoDB.delete(params).promise();
    console.log(`Successfully deleted star information for task ${taskId}`);
  } catch (error) {
    console.error(`Error deleting star information for task ${taskId}:`, error);
    // エラーをスローしない - タスク削除処理を継続させる
  }
}

/**
 * リストに関連するすべてのスター付きタスクを削除
 * @param {string} userId - ユーザーID
 * @param {string} listId - リストID
 * @returns {Promise<void>}
 */
async function deleteStarredTasksByList(userId, listId) {
  try {
    console.log(`Deleting all star information for list ${listId} for user ${userId}`);
    
    // まず、このリストに関連するすべてのスター付きタスクを取得
    const queryParams = {
      TableName: STARRED_TASKS_TABLE,
      IndexName: 'ListIdIndex',
      KeyConditionExpression: 'userId = :userId AND listId = :listId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':listId': listId
      }
    };
    
    console.log('DynamoDB query params:', JSON.stringify(queryParams));
    
    const result = await dynamoDB.query(queryParams).promise();
    const tasks = result.Items || [];
    
    console.log(`Found ${tasks.length} starred tasks in list ${listId} to delete`);
    
    // 各タスクを削除
    for (const task of tasks) {
      await deleteStarredTask(userId, task.taskId);
    }
    
    console.log(`Successfully deleted all star information for list ${listId}`);
  } catch (error) {
    console.error(`Error deleting star information for list ${listId}:`, error);
    // エラーをスローしない - リスト削除処理を継続させる
  }
}
