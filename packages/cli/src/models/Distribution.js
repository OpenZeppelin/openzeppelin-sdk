import makeContract from '../utils/contract'
const Release = makeContract(require('zos-kernel/build/contracts/Release.json'))
const Package = makeContract('Package')

class Distribution {

  constructor(owner) {
    this.owner = owner
  }

  address() {
    return this.package.address
  }

  async connect(address) {
    this.package = new Package(address)
    return this.package
  }

  async deploy() {
    this.package = await Package.new({ from: this.owner })
    return this.package
  }

  async getRelease(version) {
    const releaseAddress = await this.package.getVersion(version)
    return new Release(releaseAddress)
  }

  async hasVersion(version) {
    return await this.package.hasVersion(version, { from: this.owner })
  }

  async newVersion(version) {
    const release = await Release.new({ from: this.owner })
    await this.package.addVersion(version, release.address, { from: this.owner })
    return release
  }

  async getImplementation(version, contractName) {
    const release = await this.getRelease(version)
    return await release.getImplementation(contractName)
  }

  async setImplementation(version, contractClass, contractName) {
    const implementation = await contractClass.new({ from: this.owner })
    const release = await this.getRelease(version)
    await release.setImplementation(contractName, implementation.address, { from: this.owner })
    return implementation
  }

  async frozen(version) {
    const release = await this.getRelease(version)
    return await release.frozen()
  }

  async freeze(version) {
    const release = await this.getRelease(version)
    await release.freeze({ from: this.owner })
  }
}

export default Distribution
