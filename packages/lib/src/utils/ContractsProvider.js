import truffleContract from 'truffle-contract'
import truffleProvision from 'truffle-provisioner'

export default {
  getFromLib(contractName) {
    // this function should be overwritten when used outside lib
    return this.getByName(contractName)
  },

  getFromKernel(contractName) {
    throw 'getFromKernel function must be implemented'
  },

  getFromArtifacts(name) {
    return artifacts.require(name)
  },

  getByName(name) {
    const path = `${process.cwd()}/build/contracts/${name}.json`
    return this.getByJSONData(require(path))
  },

  getByJSONData(data) {
    const contract = truffleContract(data)
    truffleProvision(contract, this.artifactsDefaults())
    return contract
  },

  artifactsDefaults() {
    if(!artifacts) throw "Could not retrieve truffle defaults"
    return artifacts.options || {}
  },
}
