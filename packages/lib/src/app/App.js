'use strict'

import Logger from '../utils/Logger'
import decodeLogs from '../helpers/decodeLogs'
import encodeCall from '../helpers/encodeCall'

import AppProvider from './AppProvider'
import AppDeployer from './AppDeployer'

const log = new Logger('App')

export default class App {
  constructor(_app, factory, appDirectory, _package, version, txParams = {}) {
    this._app = _app
    this.factory = factory
    this.package = _package
    this.version = version
    this.directories = {}
    this.directories[version] = appDirectory
    this.txParams = txParams
  }

  static async fetch() {
    return await AppProvider.from(...arguments);
  }

  static async deploy() {
    return await AppDeployer.deploy(...arguments);
  }

  address() {
    return this._app.address
  }

  currentDirectory() {
    return this.directories[this.version]
  }

  async getImplementation(contractName) {
    const directory = this.currentDirectory()
    return directory.getImplementation(contractName)
  }

  async setImplementation(contractClass, contractName) {
    log.info(`Setting implementation of ${contractName} in directory...`)
    const implementation = await contractClass.new(this.txParams)
    const directory = this.currentDirectory()
    await directory.setImplementation(contractName, implementation.address, this.txParams)
    log.info(` Implementation set: ${implementation.address}`)
    return implementation
  }

  async setStdlib(stdlibAddress = 0x0) {
    log.info(`Setting stdlib ${stdlibAddress}...`)
    await this.currentDirectory().setStdlib(stdlibAddress, this.txParams)
    return stdlibAddress
  }

  async newVersion(versionName, stdlibAddress = 0) {
    log.info(`Adding version ${versionName}...`)
    const AppDirectory = Contracts.getFromLib('AppDirectory')
    const directory = await AppDirectory.new(stdlibAddress, this.txParams)
    log.info(` App directory: ${directory.address}`)
    await this.package.addVersion(versionName, directory.address, this.txParams)
    log.info(` Added version: ${versionName}`)
    await this._app.setVersion(versionName, this.txParams)
    log.info(` Version set`)
    this.directories[versionName] = directory
    this.version = versionName
  }

  async createProxy(contractClass, contractName, initMethodName, initArgs) {
    log.info(`Creating ${contractName} proxy...`)
    const { receipt } = typeof(initArgs) === 'undefined'
      ? await this._createProxy(contractName)
      : await this._createProxyAndCall(contractClass, contractName, initMethodName, initArgs)

    log.info(` TX receipt received: ${receipt.transactionHash}`)
    const UpgradeabilityProxyFactory = Contracts.getFromLib('UpgradeabilityProxyFactory')
    const logs = decodeLogs(receipt.logs, UpgradeabilityProxyFactory)
    const address = logs.find(l => l.event === 'ProxyCreated').args.proxy
    log.info(` ${contractName} proxy: ${address}`)
    return new contractClass(address)
  }

  async upgradeProxy(proxyAddress, contractClass, contractName, initMethodName, initArgs) {
    log.info(`Updating ${contractName} proxy...`)
    const { receipt } = typeof(initArgs) === 'undefined'
      ? await this._updateProxy(proxyAddress, contractName)
      : await this._updateProxyAndCall(proxyAddress, contractClass, contractName, initMethodName, initArgs)
    log.info(` TX receipt received: ${receipt.transactionHash}`)
  }

  async _createProxy(contractName) {
    return this._app.create(contractName, this.txParams)
  }

  async _createProxyAndCall(contractClass, contractName, initMethodName, initArgs) {
    const initMethod = this._validateInitMethod(contractClass, initMethodName, initArgs)
    const initArgTypes = initMethod.inputs.map(input => input.type)
    const callData = encodeCall(initMethodName, initArgTypes, initArgs)
    return this._app.createAndCall(contractName, callData, this.txParams)
  }

  async _updateProxy(proxyAddress, contractName) {
    return this._app.upgrade(proxyAddress, contractName, this.txParams)
  }

  async _updateProxyAndCall(proxyAddress, contractClass, contractName, initMethodName, initArgs) {
    const initMethod = this._validateInitMethod(contractClass, initMethodName, initArgs)
    const initArgTypes = initMethod.inputs.map(input => input.type)
    const callData = encodeCall(initMethodName, initArgTypes, initArgs)
    return this._app.upgradeAndCall(proxyAddress, contractName, callData, this.txParams)
  }

  _validateInitMethod(contractClass, initMethodName, initArgs) {
    const initMethod = contractClass.abi.find(fn => fn.name === initMethodName && fn.inputs.length === initArgs.length)
    if (!initMethod) throw `Could not find initialize method '${initMethodName}' with ${initArgs.length} arguments in contract class`
    return initMethod
  }
}
