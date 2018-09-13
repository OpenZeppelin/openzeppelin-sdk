import { promisify } from 'util'
import Contracts from '../utils/Contracts';
import { toAddress } from '../utils/Addresses';
import { deploy as deployContract, sendTransaction } from "../utils/Transactions";

export default class Proxy {
  static at(address, txParams = {}) {
    const Proxy = Contracts.getFromLib('AdminUpgradeabilityProxy')
    const contract = new Proxy(address)
    return new this(contract, txParams)
  }

  static async deploy(implementation, txParams = {}) {
    const contract = await deployContract(Contracts.getFromLib('AdminUpgradeabilityProxy'), [toAddress(implementation)], txParams)
    return new this(contract, txParams)
  }

  constructor(contract, txParams = {}) {
    this.contract = contract
    this.address = toAddress(contract)
    this.txParams = txParams
  }

  async upgradeTo(address) {
    await this._checkAdmin()
    return sendTransaction(this.contract.upgradeTo, [toAddress(address)], this.txParams)
  }

  async changeAdmin(newAdmin) {
    await this._checkAdmin()
    return sendTransaction(this.contract.changeAdmin, [newAdmin], this.txParams)
  }

  async implementation() {
    const position = web3.sha3('org.zeppelinos.proxy.implementation')
    return this.getStorageAt(position)
  }

  async admin() {
    const position = web3.sha3('org.zeppelinos.proxy.admin')
    return this.getStorageAt(position)
  }

  async getStorageAt(position) {
    return promisify(web3.eth.getStorageAt.bind(web3.eth))(this.address, position)
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
