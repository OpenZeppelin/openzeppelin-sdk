export default class Proxy {
  static at(address) {
    return new Proxy(address)
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
    return web3.eth.getStorageAt(this.address, position)
  }
}
