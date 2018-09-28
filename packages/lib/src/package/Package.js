import Logger from '../utils/Logger'
import { deploy as deployContract, sendTransaction } from '../utils/Transactions'
import ImplementationDirectory from '../directory/ImplementationDirectory';
import Contracts from '../utils/Contracts';
import { toAddress, isZeroAddress } from '../utils/Addresses';
import _ from 'lodash';
import { toSemanticVersion } from '../utils/Semver';

const log = new Logger('Package')

export default class Package {

  static async fetch(address, txParams = {}) {
    if (isZeroAddress(address)) return null
    const Package = Contracts.getFromLib('Package')
    const packageContract = await Package.at(address)
    return new this(packageContract, txParams)
  }

  static async deploy(txParams = {}) {
    log.info('Deploying new Package...')
    const Package = Contracts.getFromLib('Package')
    const packageContract = await deployContract(Package, [], txParams)
    log.info(`Deployed Package ${packageContract.address}`)
    return new this(packageContract, txParams)
  }

  constructor(packageContract, txParams = {}) {
    this.packageContract = packageContract
    this.txParams = txParams
  }

  get contract() {
    return this.packageContract
  }

  get address() {
    return this.packageContract.address
  }

  async hasVersion(version) {
    return this.packageContract.hasVersion(toSemanticVersion(version))
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
    const directory = await this.getDirectory(version)
    return directory.getImplementation(contractName)
  }

  async newVersion(version, content = "") {
    log.info('Adding new version...')
    const semver = toSemanticVersion(version)
    const directory = await ImplementationDirectory.deploy(this.txParams)
    await sendTransaction(this.packageContract.addVersion, [semver, directory.address, content], this.txParams)
    log.info(`Added version ${semver.join('.')}`)
    return directory
  }

  async getDirectory(version) {
    if (!version) throw Error("Cannot get a directory from a package without specifying a version")
    const directoryAddress = await this.packageContract.getContract(toSemanticVersion(version))
    return ImplementationDirectory.fetch(directoryAddress, this.txParams)
  }
}