require('ts-node/register')

module.exports = {
  networks: {
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555
    }
  },
  compilers: {
    solc: {
      version: "0.5.2",
      docker: true
    }
  }

}
