import _ from 'lodash'
import { promisify } from 'util'
import { FileSystem as fs } from 'zos-lib'

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

  exists(root = process.cwd()) {
    const truffleFile = `${root}/truffle.js`
    const truffleConfigFile = `${root}/truffle-config.js`
    return fs.exists(truffleFile) || !fs.exists(truffleConfigFile)
  },

  buildDir() {
    const config = this.init()
    return config.contracts_build_directory
  },

  solcSettings() {
    const config = this.init()
    const compilerSettings = config.compilers || {}
    return compilerSettings.solc
  },

  loadProviderAndDefaults(network) {
    const config = this.init()
    const { networks: networkList } = config
    if (!networkList[network]) throw Error(`Given network '${network}' is not defined in your truffle-config file`)

    config.network = network
    if (networkList[network].from) networkList[network].from = networkList[network].from.toLowerCase()

    const TruffleResolver = require('truffle-resolver')
    config.resolver = new TruffleResolver(config)
    const { provider, resolver } = this._setNonceTrackerIfNeeded(config)

    const artifactDefaults = _.pickBy(_.pick(resolver.options, 'from', 'gas', 'gasPrice'))
    if (artifactDefaults.from) artifactDefaults.from = artifactDefaults.from.toLowerCase()
    return { provider, artifactDefaults }
  },

  // This function fixes a truffle issue related to HDWalletProvider that occurs when assigning
  // the network provider as a function (that returns an HDWalletProvider instance) instead of
  // assigning the HDWalletProvider instance directly.
  // (see https://github.com/trufflesuite/truffle-hdwallet-provider/issues/65)
  _setNonceTrackerIfNeeded({ resolver, provider }) {
    const { engine } = provider
    if (engine && engine.constructor.name === 'Web3ProviderEngine') {
      const NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker')
      const nonceTracker = new NonceSubprovider()
      engine._providers.forEach((provider, index) => {
        if (provider.constructor.name === 'ProviderSubprovider') {
          nonceTracker.setEngine(engine)
          engine._providers.splice(index, 0, nonceTracker)
        }
      })
      resolver.options = Object.assign({}, resolver.options, { provider })
    }
    return { resolver, provider }
  },
}

export default TruffleConfig
