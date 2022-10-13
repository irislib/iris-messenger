
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./iris.cjs.production.min.js')
} else {
  module.exports = require('./iris.cjs.development.js')
}
