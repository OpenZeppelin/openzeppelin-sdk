import path from 'path'
import truffleContract from 'truffle-contract'
import truffleProvision from 'truffle-provisioner'

const DEFAULT_TESTING_TX_PARAMS = {
  gas: 6721975,
  gasPrice: 100000000000
}

const DEFAULT_COVERAGE_TX_PARAMS = {
  gas: 0xfffffffffff,
  gasPrice: 0x01,
}

export default {
  getFromLocal(contractName) {
    const buildDir = `${process.cwd()}/build/contracts/`
    return this._getFromBuildDir(buildDir, contractName)
  },

  getFromLib(contractName) {
    const buildDir = path.resolve(__dirname, '../../build/contracts')
    return this._getFromBuildDir(buildDir, contractName)
  },

  getFromNodeModules(dependency, contractName) {
    const buildDir = `${process.cwd()}/node_modules/${dependency}/build/contracts`
    return this._getFromBuildDir(buildDir, contractName)
  },

  _getFromBuildDir(buildDir, contractName) {
    const path = `${buildDir}/${contractName}.json`
    const contract = truffleContract(require(path))
    return (process.env.NODE_ENV === 'test')
      ? this._provideContractForTesting(contract)
      : this._provideContractForProduction(contract)
  },

  _provideContractForProduction(contract) {
    truffleProvision(contract, this._artifactsDefaults())
    return contract
  },

  _provideContractForTesting(contract) {
    const defaults = process.env.SOLIDITY_COVERAGE ? DEFAULT_COVERAGE_TX_PARAMS : DEFAULT_TESTING_TX_PARAMS
    contract.setProvider(web3.currentProvider)
    contract.defaults({ from: web3.eth.accounts[0], ... defaults })
    return contract
  },

  _artifactsDefaults() {
    if(!artifacts) throw "Could not retrieve truffle defaults"
    return artifacts.options || {}
  },
}
