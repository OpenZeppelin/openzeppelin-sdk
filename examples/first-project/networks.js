module.exports = {
  networks: {
    local: {
      protocol: 'http',
      host: 'localhost',
      port: 8545,
      gas: 5000000,
      gasPrice: 5e9,
      // eslint-disable-next-line @typescript-eslint/camelcase
      network_id: '*',
    },
    test: {
      protocol: 'http',
      host: 'localhost',
      port: 9555,
      gas: 5000000,
      gasPrice: 5e9,
      // eslint-disable-next-line @typescript-eslint/camelcase
      network_id: '4447',
    },
  },
};
