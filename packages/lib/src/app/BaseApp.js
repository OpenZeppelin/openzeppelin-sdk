'use strict'

import Logger from '../utils/Logger'
import Contracts from '../utils/Contracts'
import decodeLogs from '../helpers/decodeLogs'
import encodeCall from '../helpers/encodeCall'
import copyContract from '../helpers/copyContract'
import { deploy as deployContract, sendTransaction } from '../utils/Transactions'

import UpgradeabilityProxyFactory from '../factory/UpgradeabilityProxyFactory';
import FreezableImplementationDirectory from '../directory/FreezableImplementationDirectory';
import { isZeroAddress } from '../utils/Addresses';

const log = new Logger('App')

export default class BaseApp {

  static async fetch(address, txParams = {}) {
    const appContract = await this.getContractClass().at(address)    
    return new this(appContract, txParams)
  }

  static async deploy(txParams = {}) {
    const factory = await UpgradeabilityProxyFactory.deploy(txParams)
    log.info('Deploying new App...')
    const appContract = await deployContract(this.getContractClass(), [factory.address], txParams)
    log.info(`Deployed App at ${appContract.address}`)
    return new this(appContract, txParams)
  }

  static getContractClass() {
    throw Error("Unimplemented")
  }

  constructor(appContract, txParams = {}) {
    this.appContract = appContract
    this.txParams = txParams
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

  async getProvider(name, providerClass = FreezableImplementationDirectory) {
    const address = await this.appContract.getProvider(name)
    if (isZeroAddress(address)) return null
    return await providerClass.fetch(address, this.txParams)
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
    const UpgradeabilityProxyFactory = Contracts.getFromLib('UpgradeabilityProxyFactory')
    const logs = decodeLogs(receipt.logs, UpgradeabilityProxyFactory)
    const address = logs.find(l => l.event === 'ProxyCreated').args.proxy
    log.info(`${packageName} ${contractName} proxy: ${address}`)
    return new contractClass(address)
  }

  async upgradeProxy(proxyAddress, contractClass, packageName, contractName, initMethodName, initArgs) {
    const { receipt } = typeof(initArgs) === 'undefined'
      ? await this._upgradeProxy(proxyAddress, packageName, contractName)
      : await this._upgradeProxyAndCall(proxyAddress, contractClass, packageName, contractName, initMethodName, initArgs)
    log.info(`TX receipt received: ${receipt.transactionHash}`)
  }

  async _createProxy(packageName, contractName) {
    log.info(`Creating ${packageName} ${contractName} proxy without initializing...`)
    return sendTransaction(this.appContract.create, [packageName, contractName], this.txParams)
  }

  async _createProxyAndCall(contractClass, packageName, contractName, initMethodName, initArgs) {
    const { initMethod, callData } = this._buildInitCallData(contractClass, initMethodName, initArgs)
    log.info(`Creating ${packageName} ${contractName} proxy and calling ${this._callInfo(initMethod, initArgs)}`)
    return sendTransaction(this.appContract.createAndCall, [packageName, contractName, callData], this.txParams)
  }

  async _upgradeProxy(proxyAddress, packageName, contractName) {
    log.info(`Upgrading ${packageName} ${contractName} proxy without running migrations...`)
    return sendTransaction(this.appContract.upgrade, [proxyAddress, packageName, contractName], this.txParams)
  }

  async _upgradeProxyAndCall(proxyAddress, contractClass, packageName, contractName, initMethodName, initArgs) {
    const initMethod = this._validateInitMethod(contractClass, initMethodName, initArgs)
    const initArgTypes = initMethod.inputs.map(input => input.type)
    log.info(`Upgrading ${packageName} ${contractName} proxy and calling ${this._callInfo(initMethod, initArgs)}...`)
    const callData = encodeCall(initMethodName, initArgTypes, initArgs)
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
      const {initMethod, callData} = this._buildInitCallData(contractClass, initMethodName, initArgs)
      log.info(`Initializing ${packageName} ${contractName} instance at ${instance.address} by calling ${this._callInfo(initMethod, initArgs)}`)
      await instance.sendTransaction(Object.assign({}, this.txParams, {data: callData}))
    }
  }

  _buildInitCallData(contractClass, initMethodName, initArgs) {
    const initMethod = this._validateInitMethod(contractClass, initMethodName, initArgs)
    const initArgTypes = initMethod.inputs.map(input => input.type)
    const callData = encodeCall(initMethodName, initArgTypes, initArgs)
    return { initMethod, callData }
  }

  _validateInitMethod(contractClass, initMethodName, initArgs) {
    const initMethod = contractClass.abi.find(fn => fn.name === initMethodName && fn.inputs.length === initArgs.length)
    if (!initMethod) throw Error(`Could not find initialize method '${initMethodName}' with ${initArgs.length} arguments in contract class`)
    return initMethod
  }

  _callInfo(initMethod, initArgs) {
    const args = initMethod.inputs.map((input, index) => ` - ${input.name} (${input.type}): ${JSON.stringify(initArgs[index])}`)
    return `${initMethod.name} with: \n${args.join('\n')}`
  }
}
