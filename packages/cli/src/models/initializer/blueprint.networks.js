module.exports = {
  networks: {
    local: {
      protocol: 'http',
      host: 'localhost',
      port: 9545,
      gas: 5000000,
      gasPrice: 5e9,
      // eslint-disable-next-line @typescript-eslint/camelcase
      network_id: '*',
    },
  },
};
