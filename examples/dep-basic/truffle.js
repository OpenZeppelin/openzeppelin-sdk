module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 9545,
      network_id: '*'
    },
    ropsten: {
      host: 'localhost',
      port: 8565,
      network_id: "3",
      gasPrice: 10e9
    }
  }
};
