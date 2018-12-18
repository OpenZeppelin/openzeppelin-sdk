import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { Logger, FileSystem as fs } from 'zos-lib'

const log = new Logger('Truffle')

const Truffle = {
  config() {
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

  async compile() {
    log.info('Compiling contracts with Truffle...')
    return new Promise((resolve, reject) => {
      exec(`${process.cwd()}/node_modules/.bin/truffle compile`, (error, stdout, stderr) => {
        if (stdout) console.log(stdout)
        if (stderr) console.error(stderr)
        error ? reject(error) : resolve({ stdout, stderr })
      })
    })
  },

  init(root = process.cwd()) {
    this._initContractsDir(root)
    this._initMigrationsDir(root)
    this._initTruffleConfig(root)
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

    return { resolver, provider }
  },

  async getNetworkName() {
    const version = await promisify(global.web3.version.getNetwork.bind(global.web3.version))()
    // Reference: see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md#list-of-chain-ids
    switch (version) {
      case "1":
        return 'mainnet'
      case "2":
        return 'morden'
      case "3":
        return 'ropsten'
      case "4":
        return 'rinkeby'
      case "42":
        return 'kovan'
      default:
        return `dev-${version}`
    }
  },

  _initContractsDir(root) {
    const contractsDir = `${root}/contracts`
    this._initDir(contractsDir)
  },

  _initMigrationsDir(root) {
    const migrationsDir = `${root}/migrations`
    this._initDir(migrationsDir);
  },

  _initTruffleConfig(root) {
    const truffleFile = `${root}/truffle.js`
    const truffleConfigFile = `${root}/truffle-config.js`
    if (!fs.exists(truffleFile) && !fs.exists(truffleConfigFile)) {
      const blueprint = path.resolve(__dirname, './blueprint.truffle.js')
      fs.copy(blueprint, truffleConfigFile)
    }
  },

  _initDir(dir) {
    if (!fs.exists(dir)) {
      fs.createDir(dir)
      fs.write(`${dir}/.gitkeep`, '')
    }
  },
}

export default Truffle
