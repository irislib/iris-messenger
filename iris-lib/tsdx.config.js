module.exports = {
  rollup(config) {
    if (config.output.format === 'umd') {
      delete config.external;
    }
    return config;
  }
}