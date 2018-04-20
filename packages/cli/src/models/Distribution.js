const Release = artifacts.require('Release')
const Package = artifacts.require('Package')

class Distribution {

  constructor(owner, network) {
    this.owner = owner
    this.network = network
  }

  address() {
    return this.package.address
  }

  async deploy(initialVersion) {
    this.package = await Package.new({ from: this.owner })
    const release = await Release.new({ from: this.owner })
    await this.package.addVersion(initialVersion, release.address, { from: this.owner })
    return this.package
  }

  async getRelease(version) {
    return this.package.getRelease(version)
  }

  async connect(address) {
    this.package = Package.at(address)
    return this.package
  }

  async newVersion(version) {
    const release = await Release.new({ from: this.owner })
    await this.package.addVersion(version, release.address, { from: this.owner })
  }

  async getImplementation(version, contractName) {
    const release = await this.getRelease(version)
    return release.getImplementation(contractName)
  }

  async setImplementation(version, contractClass, contractName) {
    const implementation = await contractClass.new({ from: this.owner })
    const release = await this.getRelease(version)
    await release.setImplementation(contractName, implementation.address, { from: this.owner })
    return implementation
  }

  async freeze(version) {
    const release = await this.getRelease(version)
    await release.freeze()
  }
}

export default Distribution
