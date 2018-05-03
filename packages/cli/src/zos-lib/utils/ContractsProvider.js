import truffleContract from 'truffle-contract'
import truffleProvision from 'truffle-provisioner'

const ContractsProvider = {
  kernel() {
    return this.getFromKernel('Kernel')
  },

  release() {
    return this.getFromKernel('Release')
  },

  zepToken() {
    return this.getFromKernel('ZepToken')
  },

  vouching() {
    return this.getFromKernel('Vouching')
  },

  getFromKernel(contractName) {
    const data = require(`zos-kernel/build/contracts/${contractName}.json`);
    return this.getByJSONData(data)
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

export default ContractsProvider
