const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use('/data', createProxyMiddleware({
    target: 'http://localhost:3005',
    changeOrigin: true,
    pathRewrite: {
      '^/data': '/'
    }
  }));
};