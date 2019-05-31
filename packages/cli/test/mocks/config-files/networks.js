require('ts-node/register')

module.exports = {
  networks: {
    local: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: 5000000
    },
    testing: {
      host: 'localhost',
      network_id: '4447',
      port: 9555
    },
  },
  mocha: {
    forbidOnly: !!process.env.CI
  }
}
