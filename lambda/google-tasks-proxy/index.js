const axios = require('axios');

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event));
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*', // 本番環境では特定のドメインに制限すべき
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
  };
  
  // OPTIONSリクエストの処理
  if (event.httpMethod === 'OPTIONS') {
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
      data: body
    });
    
    console.log('Google Tasks API response status:', response.status);
    
    // レスポンスを返す
    return {
      statusCode: response.status,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(response.data)
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
