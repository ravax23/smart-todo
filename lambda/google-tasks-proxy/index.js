const axios = require('axios');

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
    const path = event.path.replace('/api/tasks', '');
    const method = event.httpMethod;
    const queryParams = event.queryStringParameters || {};
    const body = event.body ? JSON.parse(event.body) : undefined;
    
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
    console.error('Error proxying request to Google Tasks API:', error);
    
    // エラーレスポンスの処理
    const statusCode = error.response?.status || 500;
    const errorData = error.response?.data || { error: 'Internal Server Error' };
    
    return {
      statusCode,
      headers,
      body: JSON.stringify(errorData)
    };
  }
};
