module.exports = {
  networks: {
    local: {
      protocol: 'http',
      host: 'localhost',
      port: 8545,
      gas: 5000000,
      gasPrice: 5e9,
      networkId: '*',
    },
    test: {
      protocol: 'http',
      host: 'localhost',
      port: 9555,
      gas: 5000000,
      gasPrice: 5e9,
      networkId: '4447',
    },
  },
};
