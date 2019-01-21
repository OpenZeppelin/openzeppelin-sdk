require('babel-register')
require('babel-polyfill')

module.exports = {
  networks: {
    ropsten: {
      host: 'localhost',
      network_id: '3', // eslint-disable-line camelcase
      port: 8565
    },
    local: {
      host: 'localhost',
      network_id: '*', // eslint-disable-line camelcase
      port: 8545
    }
  }
}
