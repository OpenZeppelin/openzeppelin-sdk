import ZWeb3 from '../artifacts/ZWeb3'
import Contracts from '../artifacts/Contracts'
import { toAddress, uint256ToAddress } from '../utils/Addresses'
import { deploy as deployContract, sendTransaction } from '../utils/Transactions'

export default class Proxy {
  static at(address, txParams = {}) {
    const ProxyContract = Contracts.getFromLib('AdminUpgradeabilityProxy')
    const contract = ProxyContract.at(toAddress(address))
    return new this(contract, txParams)
  }

  static async deploy(implementation, initData, txParams = {}) {
    const contract = await deployContract(Contracts.getFromLib('AdminUpgradeabilityProxy'), [toAddress(implementation), initData || ''], txParams)
    return new this(contract, txParams)
  }

  constructor(contract, txParams = {}) {
    this.contract = contract
    this.address = toAddress(contract)
    this.txParams = txParams
  }

  async upgradeTo(address, migrateData) {
    await this._checkAdmin()
    return migrateData
      ? sendTransaction(this.contract.upgradeToAndCall, [toAddress(address), migrateData], this.txParams)
      : sendTransaction(this.contract.upgradeTo, [toAddress(address)], this.txParams)
  }

  async changeAdmin(newAdmin) {
    await this._checkAdmin()
    return sendTransaction(this.contract.changeAdmin, [newAdmin], this.txParams)
  }

  async implementation() {
    const position = ZWeb3.sha3('org.zeppelinos.proxy.implementation')
    return uint256ToAddress(await this.getStorageAt(position))
  }

  async admin() {
    const position = ZWeb3.sha3('org.zeppelinos.proxy.admin')
    return uint256ToAddress(await this.getStorageAt(position))
  }

  async getStorageAt(position) {
    return ZWeb3.getStorageAt(this.address, position)
  }

  async _checkAdmin() {
    const currentAdmin = await this.admin()
    const from = this.txParams.from
    // TODO: If no `from` is set, load which is the default account and use it to compare against the current admin
    if (from && currentAdmin !== from) {
      throw new Error(`Cannot modify proxy from non-admin account: current admin is ${currentAdmin} and sender is ${from}`)
    }
  }
}
