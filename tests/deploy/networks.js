const fs = require('fs');

const extra = fs.existsSync('extra-networks.json')
  ? JSON.parse(fs.readFileSync('extra-networks.json'))
  : {};

module.exports = {
  networks: {
    'geth-dev': {
      url: 'http://localhost:8545',
      networkId: '9955',
      gasPrice: 1e9,
    },
    ...extra
  },
};
