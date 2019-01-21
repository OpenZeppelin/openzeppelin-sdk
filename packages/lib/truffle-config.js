require('ts-node/register')

module.exports = {
  networks: {
    test: {
      host: 'test',
      network_id: '*',
      gas: 6721975,
      gasPrice: 100000000000
    },
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555
    }
  }
}
