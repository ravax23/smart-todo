const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // API Gateway URL（環境変数から取得）
  const apiGatewayUrl = process.env.REACT_APP_API_GATEWAY_URL || 'https://t3mexbcl3e.execute-api.us-east-1.amazonaws.com/prod';
  
  console.log('Setting up proxy with API Gateway URL:', apiGatewayUrl);
  
  // スター関連のエンドポイントを API Gateway に転送
  app.use(
    ['/api/tasks/starred', '/tasks/starred'],
    createProxyMiddleware({
      target: apiGatewayUrl,
      changeOrigin: true,
      pathRewrite: function(path) {
        console.log(`Rewriting path: ${path} to /api/tasks/starred`);
        return '/api/tasks/starred';
      },
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log(`Proxying request: ${req.method} ${req.path} -> ${proxyReq.path}`);
      },
    })
  );
  
  // スター状態更新エンドポイントを API Gateway に転送
  app.use(
    '/api/tasks/*/star',
    createProxyMiddleware({
      target: apiGatewayUrl,
      changeOrigin: true,
      pathRewrite: function(path) {
        return path;
      },
      logLevel: 'debug',
    })
  );
  
  // その他の /api/tasks リクエストを Google Tasks API に転送
  app.use(
    '/api/tasks',
    createProxyMiddleware({
      target: 'https://tasks.googleapis.com',
      changeOrigin: true,
      pathRewrite: {
        '^/api/tasks': '',
      },
      onProxyRes: function(proxyRes, req, res) {
        // CORSヘッダーを追加
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
      },
      // OPTIONSリクエストを適切に処理
      onProxyReq: function(proxyReq, req, res) {
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
          res.statusCode = 200;
          res.end();
          return;
        }
      },
      logLevel: 'debug',
    })
  );
};
