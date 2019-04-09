require('ts-node/register')

module.exports = {
  networks: {
    testing: {
      host: 'localhost',
      network_id: '4447',
      port: 9555
    },
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555
    }
  },
  compilers: {
    solc: {
      version: "0.5.3",
      evmVersion: "constantinople"
    }
  },
  mocha: {
    forbidOnly: !!process.env.CI
  }
}
