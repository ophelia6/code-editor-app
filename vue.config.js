const { defineConfig } = require('@vue/cli-service')
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = {
  transpileDependencies: true,
  devServer: {
    onBeforeSetupMiddleware: (devServer) => {
      if (!devServer.app) {
        throw new Error('devServer.app is undefined. Ensure you are using Vue CLI version 4.5.0 or later.');
      }

      devServer.app.use(
        '/v1',
        createProxyMiddleware({
          target: 'https://api.jdoodle.com',
          changeOrigin: true,
          pathRewrite: {
            '^/v1': '/v1',
          },
        })
      );
    },
  },
};

