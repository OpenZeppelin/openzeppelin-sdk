import { Logger, App } from 'zos-lib'
import StatusReport from './StatusReport'
import EventsFilter from './EventsFilter'
import { bytecodeDigest } from '../../utils/contracts'

const log = new Logger('StatusComparator')
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export default class StatusComparator {
  constructor(networkFile, txParams = {}) {
    this.reports = []
    this.txParams = txParams
    this.networkFile = networkFile
  }

  async app() {
    try {
      if(!this._app) this._app = await App.fetch(this.networkFile.appAddress, this.txParams)
      return this._app
    } catch(error) {
      throw Error(`Cannot fetch App contract from address ${this.networkFile.appAddress}.`, error)
    }
  }

  async call() {
    log.info(`Comparing status of App ${(await this.app()).address()}...\n`)
    await this.checkVersion()
    await this.checkProvider()
    await this.checkStdlib()
    await this.checkImplementations()
    await this.checkProxies()
    this.reports.forEach(report => report.log(log))
    if(this.reports.length === 0) log.info('Your app is up to date.')
  }

  async checkVersion() {
    const observed = (await this.app()).version
    const expected = this.networkFile.version
    if(observed !== expected) this._addReport(expected, observed, 'App version does not match')
  }

  async checkProvider() {
    const observed = (await this.app()).currentDirectory().address
    const expected = this.networkFile.providerAddress
    if(observed !== expected) this._addReport(expected, observed, 'Provider address does not match')
  }

  async checkStdlib() {
    const app = await this.app();
    const currentStdlib = await app.currentStdlib();
    const observed = currentStdlib === ZERO_ADDRESS ? 'none' : currentStdlib
    const expected = this.networkFile.stdlibAddress || 'none'
    if(observed !== expected) this._addReport(expected, observed, 'Stdlib address does not match')
  }

  async checkImplementations() {
    const implementationsInfo = await this._fetchOnChainImplementations()
    implementationsInfo.forEach(info => this._checkRemoteImplementation(info))
    this._checkUnregisteredLocalImplementations(implementationsInfo)
  }

  async checkProxies() {
    const proxiesInfo = await this._fetchOnChainProxies()
    proxiesInfo.forEach(info => this._checkRemoteProxy(info))
    this._checkUnregisteredLocalProxies(proxiesInfo)
  }

  _checkRemoteImplementation({ alias, address }) {
    if (this.networkFile.hasContract(alias)) {
      this._checkImplementationAddress(alias, address)
      this._checkImplementationBytecode(alias, address)
    }
    else this._addReport('none', 'one', `Missing registered contract ${alias} at ${address}`)
  }

  _checkImplementationAddress(alias, address) {
    const expected = this.networkFile.contract(alias).address
    if (address !== expected) this._addReport(expected, address, `Address for contract ${alias} does not match`)
  }

  _checkImplementationBytecode(alias, address) {
    const expected = this.networkFile.contract(alias).bodyBytecodeHash
    const observed = bytecodeDigest(web3.eth.getCode(address))
    if (observed !== expected) this._addReport(expected, observed, `Bytecode at ${address} for contract ${alias} does not match`)
  }

  _checkUnregisteredLocalImplementations(implementationsInfo) {
    const foundAliases = implementationsInfo.map(info => info.alias)
    this.networkFile.contractAliases
      .filter(alias => !foundAliases.includes(alias))
      .forEach(alias => {
        const { address } = this.networkFile.contract(alias)
        this._addReport('one', 'none', `A contract ${alias} at ${address} is not registered`)
      })
  }

  _checkRemoteProxy({ alias, address, implementation}) {
    const matchingProxy = this.networkFile.proxiesList().find(proxy => proxy.address === address)
    if (matchingProxy) {
      this._checkProxyAlias(matchingProxy, alias, address, implementation)
      this._checkProxyImplementation(matchingProxy, alias, address, implementation)
    }
    else this._addReport('none', 'one', `Missing registered proxy of ${alias} at ${address} pointing to ${implementation}`)
  }

  _checkProxyAlias(proxy, alias, address, implementation) {
    const expected = proxy.alias
    if (alias !== expected) this._addReport(expected, alias, `Alias of proxy at ${address} pointing to ${implementation} does not match`)
  }

  _checkProxyImplementation(proxy, alias, address, implementation) {
    const expected = proxy.implementation
    if (implementation !== expected) this._addReport(expected, implementation, `Pointed implementation of ${alias} proxy at ${address} does not match`)
  }

  _checkUnregisteredLocalProxies(proxiesInfo) {
    const foundAddresses = proxiesInfo.map(info => info.address)
    this.networkFile.proxiesList()
      .filter(proxy => !foundAddresses.includes(proxy.address))
      .forEach(proxy => {
        const { alias, address, implementation } = proxy
        this._addReport('one', 'none', `A proxy of ${alias} at ${address} pointing to ${implementation} is not registered`)
      })
  }

  async _fetchOnChainImplementations() {
    const app = await this.app();
    const filter = new EventsFilter();
    const allEvents = await filter.call(app.currentDirectory(), 'ImplementationChanged')
    const contractsAlias = allEvents.map(event => event.args.contractName)
    return allEvents
      .filter((event, index) => contractsAlias.lastIndexOf(event.args.contractName) === index)
      .filter(event => event.args.implementation !== ZERO_ADDRESS)
      .map(event => ({ alias: event.args.contractName, address: event.args.implementation }))
  }

  async _fetchOnChainProxies() {
    const implementationsInfo = await this._fetchOnChainImplementations()
    const app = await this.app();
    const filter = new EventsFilter()
    const proxyEvents = await filter.call(app.factory, 'ProxyCreated')
    const proxiesInfo = []
    await Promise.all(proxyEvents.map(async event => {
      const address = event.args.proxy
      const implementation = await app.getProxyImplementation(address)
      const matchingImplementations = implementationsInfo.filter(info => info.address === implementation)
      if (matchingImplementations.length > 1) {
        this._addReport('one', matchingImplementations.length, `The same implementation address ${implementation} was registered under many aliases`)
      } else if (matchingImplementations.length === 0) {
        this._addReport('one', 'none', `Proxy at ${address} is pointing to ${implementation} but given implementation is not registered in app`)
      } else {
        const alias = matchingImplementations[0].alias
        proxiesInfo.push({ alias, implementation, address })
      }
    }))
    return proxiesInfo;
  }

  _addReport(expected, observed, description) {
    const report = new StatusReport(expected, observed, description);
    this.reports.push(report)
  }
}
