const WebpackBuildNotifierPlugin = require('webpack-build-notifier');
const path = require('path');

export default {
  webpack(config, env, helpers, options) {
    config.node = { fs: 'empty' };
    config.plugins = config.plugins || [];
    config.plugins.push(
      new WebpackBuildNotifierPlugin({
        title: 'Iris Webpack Build',
        logo: path.resolve('./src/assets/img/icon128.png'),
        suppressSuccess: true, // don't spam success notifications
        warningSound: false,
        suppressWarning: true,
      }),
    );
  },
};
