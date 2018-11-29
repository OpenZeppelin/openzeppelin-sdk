require('babel-register')
require('babel-polyfill')

module.exports = {
  networks: {
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555
    },
    mainnet: {
      host: 'localhost',
      port: 8546,
      network_id: '1',
      gas: 2600000,
      gasPrice: 10e9, // 10 Gwei
    }
  }
}
