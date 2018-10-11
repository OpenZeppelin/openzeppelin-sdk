const HDWalletProvider = require("truffle-hdwallet-provider")
const mnemonic = process.env.MNEMONIC || 'canyon spice man sun shiver science endless review senior lawsuit same glimpse'

module.exports = {
  networks: {
    "geth-dev": {
      host: 'localhost',
      port: 9955,
      network_id: '9955',
      gasPrice: 1e9
    },
    "geth-dev-hdwallet": {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://localhost:9955/")
      },
      network_id: '9955',
      gasPrice: 1e9
    },
    "rinkeby-infura-hdwallet": {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/")
      },
      network_id: '4',
      gasPrice: 1e9
    }
  }
};