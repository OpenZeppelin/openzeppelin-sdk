const HDWalletProvider = require("truffle-hdwallet-provider")
const mnemonic = 'canyon spice man sun shiver science endless review senior lawsuit same glimpse'

module.exports = {
  networks: {
    "geth-dev": {
      host: 'localhost',
      port: 9955,
      network_id: '9955'
    },
    "geth-dev-hdwallet": {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://localhost:9955/")
      },
      network_id: '9955'
    }
  }
};
