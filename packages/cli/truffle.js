require('ts-node/register')

module.exports = {
  networks: {
    local: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: 5000000
    }
  },
  compilers: {
    solc: {
      version: '0.4.24'
    }
  }
}
