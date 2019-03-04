module.exports = {
  networks: {
    local: {
      host: 'localhost',
      port: 9545,
      network_id: '*',
      gasPrice: 10e9
    }
  },
  compilers: {
    solc: {
      version: '0.5.4',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};
