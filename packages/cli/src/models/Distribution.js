import Logger from '../utils/Logger'
import makeContract from '../utils/contract'

const log = new Logger('Distribution');
const Package = makeContract('Package')
const Release = makeContract(require('zos-kernel/build/contracts/Release.json'))

class Distribution {

  constructor(owner) {
    this.owner = owner
    this.txParams = { from: this.owner }
  }

  address() {
    return this.package.address
  }

  async connect(address) {
    this.package = new Package(address)
    return this.package
  }

  async deploy() {
    this.package = await Package.new(this.txParams)
    return this.package
  }

  async getRelease(version) {
    const releaseAddress = await this.package.getVersion(version)
    return new Release(releaseAddress)
  }

  async hasVersion(version) {
    return await this.package.hasVersion(version, this.txParams)
  }

  async newVersion(version) {
    log.info('\nAdding new version...')
    const release = await Release.new(this.txParams)
    await this.package.addVersion(version, release.address, this.txParams)
    log.info(' Added version:', version)
    return release
  }

  async getImplementation(version, contractName) {
    const release = await this.getRelease(version)
    return await release.getImplementation(contractName)
  }

  async setImplementation(version, contractClass, contractName) {
    log.info(`\nSetting implementation of ${contractName} in version ${version}...`)
    const implementation = await contractClass.new(this.txParams)
    const release = await this.getRelease(version)
    await release.setImplementation(contractName, implementation.address, this.txParams)
    log.info(' Implementation set:', implementation.address)
    return implementation
  }

  async frozen(version) {
    const release = await this.getRelease(version)
    return await release.frozen()
  }

  async freeze(version) {
    log.info('\nFreezing new version...')
    const release = await this.getRelease(version)
    await release.freeze(this.txParams)
    log.info(' Release frozen')
  }
}

export default Distribution
