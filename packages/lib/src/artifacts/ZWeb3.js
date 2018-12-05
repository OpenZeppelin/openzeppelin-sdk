import { promisify } from 'util'
import sleep from '../helpers/sleep'

const ZWeb3 = {
  initialize(provider) {
    this.provider = provider
  },

  web3() {
    if (!this.provider) throw new Error('ZWeb3 must be initialized with a web3 provider')
    const Web3 = require('web3')
    // TODO: improve provider validation for HttpProvider scenarios
    return (typeof this.provider === 'string')
      ? new Web3.providers.HttpProvider(this.provider)
      : new Web3(this.provider)
  },

  sha3(value) {
    return this.web3().sha3(value)
  },

  isAddress(address) {
    return this.web3().isAddress(address)
  },

  eth() {
    return this.web3().eth
  },

  version() {
    return this.web3().version
  },

  contract(abi) {
    return this.eth().contract(abi)
  },

  async accounts() {
    return promisify(this.eth().getAccounts.bind(this.eth()))()
  },

  async defaultAccount() {
    return (await this.accounts())[0]
  },

  async estimateGas(params) {
    return promisify(this.eth().estimateGas.bind(this.eth()))(params)
  },

  async getBalance(address) {
    return promisify(this.eth().getBalance.bind(this.eth()))(address)
  },

  async getCode(address) {
    return promisify(this.eth().getCode.bind(this.eth()))(address)
  },

  async getNode() {
    return promisify(this.version().getNode.bind(this.version()))()
  },

  async getBlock(filter) {
    return promisify(this.eth().getBlock.bind(this.eth()))(filter)
  },

  async getLatestBlock() {
    return this.getBlock('latest')
  },

  async getLatestBlockNumber() {
    return (await this.getLatestBlock()).number
  },

  async getStorageAt(address, position) {
    return promisify(this.eth().getStorageAt.bind(this.eth()))(address, position)
  },

  async sendTransaction(params) {
    return promisify(this.eth().sendTransaction.bind(this.eth()))(params)
  },

  async getTransaction(txHash) {
    return promisify(this.eth().getTransaction.bind(this.eth()))(txHash)
  },

  async getTransactionReceipt(txHash) {
    return promisify(this.eth().getTransactionReceipt.bind(this.eth()))(txHash)
  },

  async getTransactionReceiptWithTimeout(tx, timeout) {
    return this._getTransactionReceiptWithTimeout(tx, timeout, new Date().getTime())
  },

  async isMainnet() {
    return (await this.getNetworkName()) === 'mainnet'
  },

  async getNetwork() {
    return promisify(this.version().getNetwork.bind(this.version()))()
  },

  async getNetworkName() {
    const networkId = await this.getNetwork()
    return NETWORKS[networkId] || `dev-${networkId}`
  },

  async _getTransactionReceiptWithTimeout(tx, timeout, startTime) {
    const receipt = await this._tryGettingTransactionReceipt(tx)

    if (receipt) {
      if (parseInt(receipt.status, 16) !== 0) return receipt
      throw new Error(`Transaction: ${tx} exited with an error (status 0).`)
    }

    await sleep(1000)
    const timeoutReached = timeout > 0 && new Date().getTime() - startTime > timeout
    if (!timeoutReached) return await this._getTransactionReceiptWithTimeout(tx, timeout, startTime)
    throw new Error(`Transaction ${tx} wasn't processed in ${timeout / 1000} seconds!`)
  },

  async _tryGettingTransactionReceipt(tx) {
    try {
      return await this.getTransactionReceipt(tx)
    } catch (error) {
      if (error.message.includes('unknown transaction')) return null
      else throw error
    }
  }
}

// Reference: see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md#list-of-chain-ids
const NETWORKS = {
  1:  'mainnet',
  2:  'morden',
  3:  'ropsten',
  4:  'rinkeby',
  42: 'kovan'
}

export default ZWeb3
