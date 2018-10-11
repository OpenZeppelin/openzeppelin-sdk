require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    local: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: 6000000,
      gasPrice: 2e9, // 2 Gwei
    },
    ropsten: {
      host: 'localhost',
      port: 8565,
      network_id: 3,
      gas: 50000,
      gasPrice: 10e9, // 10 Gwei
    },
    "mainnet-zos": {
      host: 'localhost',
      port: 8545,
      network_id: '1',
      gas: 1000000,
      gasPrice: 1e9,  // 1 Gwei
    }
  }
}
