require('babel-register')
require('babel-polyfill')

module.exports = {
  networks: {
    local: {
      host: 'localhost',
      port: 8545,
      network_id: '*'
    },
    ropsten: {
      host: 'localhost',
      port: 8565,
      network_id: 3,
      gasPrice: 2e9, // 2 Gwei
      gas: 6000000,
      from: '0x09902a56d04a9446601a0d451e07459dc5af0820'
    }
  }
}

