import { promisify } from 'util'

const TruffleConfig = {
  init() {
    try {
      const TruffleConfig = require('truffle-config')
      return TruffleConfig.detect({ logger: console })
    } catch (error) {
      if (error.message === 'Could not find suitable configuration file.') {
        throw Error('Could not find truffle.js config file, remember to initialize your project running "zos init".')
      } else {
        throw Error('Could not load truffle.js config file.\n' + error);
      }
    }
  },

  // This function fixes a truffle issue related to HDWalletProvider that occurs when assigning
  // the network provider as a function (that returns an HDWalletProvider instance) instead of
  // assigning the HDWalletProvider instance directly.
  // (see https://github.com/trufflesuite/truffle-hdwallet-provider/issues/65)
  setNonceTrackerIfNeeded({ resolver, provider }) {
    if (provider.engine && provider.engine.constructor.name === 'Web3ProviderEngine') {
      const NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker')
      const nonceTracker = new NonceSubprovider()
      provider.engine._providers.forEach((provider, index) => {
        if (provider.constructor.name === 'ProviderSubprovider') {
          nonceTracker.setEngine(provider.engine)
          provider.engine._providers.splice(index, 0, nonceTracker)
        }
      })
      resolver.options = Object.assign({}, resolver.options, { provider })
    }
  }
}

export default TruffleConfig
