'use strict'

import Logger from '../utils/Logger'
import decodeLogs from '../helpers/decodeLogs'
import copyContract from '../helpers/copyContract'
import { deploy as deployContract, sendTransaction, sendDataTransaction } from '../utils/Transactions'
import { isZeroAddress, toAddress } from '../utils/Addresses';
import { buildCallData, callDescription } from '../utils/ABIs';
import Contracts from '../utils/Contracts';
import { Package, ImplementationDirectory } from '..';

const log = new Logger('App')

export default class App {

  static async fetch(address, txParams = {}) {
    const appContract = await this.getContractClass().at(address)
    return new this(appContract, txParams)
  }

  static async deploy(txParams = {}) {
    log.info('Deploying new App...')
    const appContract = await deployContract(this.getContractClass(), [], txParams)
    log.info(`Deployed App at ${appContract.address}`)
    return new this(appContract, txParams)
  }

  static getContractClass() {
    return Contracts.getFromLib('App')
  }

  constructor(appContract, txParams = {}) {
    this.appContract = appContract
    this.txParams = txParams
  }

  async getPackage(name) {
    const [address, version] = await this.appContract.getPackage(name)
    const thepackage = await Package.fetch(address, this.txParams)
    return { package: thepackage, version }
  }

  async hasPackage(name) {
    const [address, _version] = await this.appContract.getPackage(name)
    return !isZeroAddress(address)
  }

  async setPackage(name, packageAddress, version) {
    return await sendTransaction(this.appContract.setPackage, [name, toAddress(packageAddress), version], this.txParams)
  }

  async unsetPackage(name) {
    return await sendTransaction(this.appContract.unsetPackage, [name], this.txParams)
  }

  get address() {
    return this.appContract.address
  }

  get contract() {
    return this.appContract
  }

  async getImplementation(packageName, contractName) {
    return this.appContract.getImplementation(packageName, contractName)
  }

  async getProxyImplementation(proxyAddress) {
    return this.appContract.getProxyImplementation(proxyAddress, this.txParams)
  }

  async hasProvider(name) {
    return (await this.getProvider(name) != null);
  }

  async getProvider(name) {
    const address = await this.appContract.getProvider(name)
    if (isZeroAddress(address)) return null
    return await ImplementationDirectory.fetch(address, this.txParams)
  }

  async changeProxyAdmin(proxyAddress, newAdmin) {
    log.info(`Changing admin for proxy ${proxyAddress} to ${newAdmin}...`)
    await sendTransaction(this.appContract.changeProxyAdmin, [proxyAddress, newAdmin], this.txParams)
    log.info(`Admin for proxy ${proxyAddress} set to ${newAdmin}`)
  }

  async createContract(contractClass, packageName, contractName, initMethodName, initArgs) {
    const instance = await this._copyContract(packageName, contractName, contractClass)
    await this._initNonUpgradeableInstance(instance, contractClass, packageName, contractName, initMethodName, initArgs)
    return instance
  }

  async createProxy(contractClass, packageName, contractName, initMethodName, initArgs) {
    const { receipt } = typeof(initArgs) === 'undefined'
      ? await this._createProxy(packageName, contractName)
      : await this._createProxyAndCall(contractClass, packageName, contractName, initMethodName, initArgs)

    log.info(`TX receipt received: ${receipt.transactionHash}`)
    const logs = decodeLogs(receipt.logs, this.constructor.getContractClass())
    const address = logs.find(l => l.event === 'ProxyCreated').args.proxy
    log.info(`${packageName} ${contractName} proxy: ${address}`)
    return new contractClass(address)
  }

  async upgradeProxy(proxyAddress, contractClass, packageName, contractName, initMethodName, initArgs) {
    const { receipt } = typeof(initArgs) === 'undefined'
      ? await this._upgradeProxy(proxyAddress, packageName, contractName)
      : await this._upgradeProxyAndCall(proxyAddress, contractClass, packageName, contractName, initMethodName, initArgs)
    log.info(`TX receipt received: ${receipt.transactionHash}`)
    return new contractClass(proxyAddress)
  }

  async _createProxy(packageName, contractName) {
    log.info(`Creating ${packageName} ${contractName} proxy without initializing...`)
    const initializeData = ''
    return sendTransaction(this.appContract.create, [packageName, contractName, initializeData], this.txParams)
  }

  async _createProxyAndCall(contractClass, packageName, contractName, initMethodName, initArgs) {
    const { method: initMethod, callData } = buildCallData(contractClass, initMethodName, initArgs)
    log.info(`Creating ${packageName} ${contractName} proxy and calling ${callDescription(initMethod, initArgs)}`)
    return sendTransaction(this.appContract.create, [packageName, contractName, callData], this.txParams)
  }

  async _upgradeProxy(proxyAddress, packageName, contractName) {
    log.info(`Upgrading ${packageName} ${contractName} proxy without running migrations...`)
    return sendTransaction(this.appContract.upgrade, [proxyAddress, packageName, contractName], this.txParams)
  }

  async _upgradeProxyAndCall(proxyAddress, contractClass, packageName, contractName, initMethodName, initArgs) {
    const { method: initMethod, callData } = buildCallData(contractClass, initMethodName, initArgs)
    log.info(`Upgrading ${packageName} ${contractName} proxy and calling ${callDescription(initMethod, initArgs)}...`)    
    return sendTransaction(this.appContract.upgradeAndCall, [proxyAddress, packageName, contractName, callData], this.txParams)
  }

  async _copyContract(packageName, contractName, contractClass) {
    log.info(`Creating new non-upgradeable instance of ${packageName} ${contractName}...`)
    const implementation = await this.getImplementation(packageName, contractName)
    const instance = await copyContract(contractClass, implementation, this.txParams)
    log.info(`${packageName} ${contractName} instance created at ${instance.address}`)
    return instance;
  }

  async _initNonUpgradeableInstance(instance, contractClass, packageName, contractName, initMethodName, initArgs) {
    if (typeof(initArgs) !== 'undefined') {
      // this could be front-run, waiting for new initializers model
      const { method: initMethod, callData } = buildCallData(contractClass, initMethodName, initArgs)
      log.info(`Initializing ${packageName} ${contractName} instance at ${instance.address} by calling ${callDescription(initMethod, initArgs)}`)
      await sendDataTransaction(instance, Object.assign({}, this.txParams, {data: callData}))
    }
  }
}
