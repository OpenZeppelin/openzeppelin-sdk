import path from 'path'
import truffleContract from 'truffle-contract'
import truffleProvision from 'truffle-provisioner'
import glob from 'glob'

const DEFAULT_TESTING_TX_PARAMS = {
  gas: 6721975,
  gasPrice: 100000000000
}

const DEFAULT_COVERAGE_TX_PARAMS = {
  gas: 0xfffffffffff,
  gasPrice: 0x01,
}

// Use same default timeout as truffle
let syncTimeout = 240000;

// Cache truffle config
let truffleConfig = null;

export default {
  getSyncTimeout() {
    return syncTimeout;
  },

  setSyncTimeout(value) {
    syncTimeout = value;
  },

  getLocalPath(contractName) {
    const buildDir = this.getLocalBuildDir()
    return `${buildDir}/${contractName}.json`
  },

  getLocalBuildDir() {
    return this.getTruffleConfig().contracts_build_directory || `${process.cwd()}/build/contracts`
  },

  getLibPath(contractName) {
    return path.resolve(__dirname, `../../build/contracts/${contractName}.json`)
  },

  getNodeModulesPath(dependency, contractName) {
    return `${process.cwd()}/node_modules/${dependency}/build/contracts/${contractName}.json`
  },

  getFromLocal(contractName) {
    return this._getFromPath(this.getLocalPath(contractName))
  },

  getFromLib(contractName) {
    return this._getFromPath(this.getLibPath(contractName))
  },

  getFromNodeModules(dependency, contractName) {
    return this._getFromPath(this.getNodeModulesPath(dependency, contractName))
  },

  getTruffleConfig() {
    if (!truffleConfig) {
      try {
        const TruffleConfig = require('truffle-config')
        truffleConfig = TruffleConfig.detect({ logger: console })
      } catch(_err) {
        return { }
      }
    }
    return truffleConfig;
  },

  listBuildArtifacts() {
    const buildDir = this.getLocalBuildDir()
    return glob.sync(`${buildDir}/*.json`)
  },

  artifactsDefaults() {
    if (!artifacts) throw Error("Could not retrieve truffle defaults")
    return artifacts.options || {}
  },

  _getFromPath(path) {
    const contract = truffleContract(require(path))
    return (process.env.NODE_ENV === 'test')
      ? this._provideContractForTesting(contract)
      : this._provideContractForProduction(contract)
  },

  _provideContractForProduction(contract) {
    truffleProvision(contract, this.artifactsDefaults())
    contract.synchronization_timeout = syncTimeout
    return contract
  },

  _provideContractForTesting(contract) {
    const defaults = process.env.SOLIDITY_COVERAGE ? DEFAULT_COVERAGE_TX_PARAMS : DEFAULT_TESTING_TX_PARAMS
    contract.setProvider(web3.currentProvider)
    contract.defaults({ from: web3.eth.accounts[0], ... defaults })
    contract.synchronization_timeout = syncTimeout
    return contract
  }
}
