module.exports = {
  networks: {
    local: {
      host: 'localhost',
      port: 9545,
      gas: 5000000,
      gasPrice: 5e9,
      network_id: '*',
    }
  },
  compilers: {
    solc: {
      version: "0.4.24"
    }
  } 
}
