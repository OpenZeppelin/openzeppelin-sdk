import Logger from '../utils/Logger'
import { deploy as deployContract, sendTransaction } from '../utils/Transactions'
import FreezableImplementationDirectory from '../directory/FreezableImplementationDirectory';
import Contracts from '../utils/Contracts';
import { toAddress, isZeroAddress } from '../utils/Addresses';

const log = new Logger('Package')

export default class Package {

  static async fetch(address, txParams = {}, directoryClass = FreezableImplementationDirectory) {
    if (isZeroAddress(address)) return null
    const Package = Contracts.getFromLib('Package')
    const packageContract = await Package.at(address)
    return new this(packageContract, txParams, directoryClass)
  }

  static async deploy(txParams = {}, directoryClass = FreezableImplementationDirectory) {
    log.info('Deploying new Package...')
    const Package = Contracts.getFromLib('Package')
    const packageContract = await deployContract(Package, [], txParams)
    log.info(`Deployed Package ${packageContract.address}`)
    return new this(packageContract, txParams, directoryClass)
  }

  constructor(packageContract, txParams = {}, directoryClass = FreezableImplementationDirectory) {
    this.packageContract = packageContract
    this.txParams = txParams
    this.directoryClass = directoryClass
  }

  get contract() {
    return this.packageContract
  }

  get address() {
    return this.packageContract.address
  }

  async hasVersion(version) {
    return sendTransaction(this.packageContract.hasVersion, [version], this.txParams)
  }

  async isFrozen(version) {
    const directory = await this.getDirectory(version)
    return directory.isFrozen()
  }

  async freeze(version) {
    const directory = await this.getDirectory(version)
    if (!directory.freeze) throw Error("Implementation directory does not support freezing")
    return directory.freeze()
  }

  async getImplementation(version, contractName) {
    return this.packageContract.getImplementation(version, contractName)
  }

  async setImplementation(version, contractName, contractAddress) {
    const directory = await this.getDirectory(version)
    await directory.setImplementation(contractName, toAddress(contractAddress))
  }

  async unsetImplementation (version, contractName) {
    const directory = await this.getDirectory(version)
    await directory.unsetImplementation(contractName, this.txParams)
  }

  async newVersion(version) {
    log.info('Adding new version...')
    const directory = await this._newDirectory()
    await sendTransaction(this.packageContract.addVersion, [version, directory.address], this.txParams)
    log.info(`Added version ${version}`)
    return directory
  }

  async getDirectory(version) {
    if (!version) throw Error("Cannot get a directory from a package without specifying a version")
    const directoryAddress = await this.packageContract.getVersion(version)
    return this.directoryClass.fetch(directoryAddress, this.txParams)
  }

  async _newDirectory() {
    return this.directoryClass.deployLocal([], this.txParams)
  }
}
