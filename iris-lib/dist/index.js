
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./iris-lib.cjs.production.min.js')
} else {
  module.exports = require('./iris-lib.cjs.development.js')
}
