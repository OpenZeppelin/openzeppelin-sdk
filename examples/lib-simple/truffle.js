require('babel-register')
require('babel-polyfill')

module.exports = {
  networks: {
    local: {
      host: 'localhost',
      port: 9545,
      network_id: '*'
    }
  }
};
