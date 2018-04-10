module.exports = {
  networks: {
    networks: {
      coverage: {
        host: 'localhost',
        network_id: '*', // eslint-disable-line camelcase
        port: 8555,
        gas: 0xfffffffffff,
        gasPrice: 0x01,
      },
    }
  }
}
