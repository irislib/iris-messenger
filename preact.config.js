export default {
  webpack(config, env, helpers, options) {
    config.node = { fs: 'empty' };
  }
}