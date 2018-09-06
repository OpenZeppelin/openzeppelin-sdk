import { promisify } from 'util'
import { Contracts } from '../utils/Contracts';
import { toAddress } from '../utils/Addresses';

export default class Proxy {
  static at(address) {
    return new Proxy(address)
  }

  static async create(implementation, txParams = {}) {
    const proxyContract = await deployContract(Contracts.getFromLib('AdminUpgradeabilityProxy'), [toAddress(implementation)], txParams)
    return new Proxy(toAddress(proxyContract))
  }

  constructor(address) {
    this.address = address
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
}
