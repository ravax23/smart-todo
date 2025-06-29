const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
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
