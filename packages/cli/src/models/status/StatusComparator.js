import { Logger } from 'zos-lib'
import StatusReport from './StatusReport'

const log = new Logger('StatusComparator')

export default class StatusComparator {
  constructor() {
    this.reports = []
  }

  onEndChecking() {
    this.reports.forEach(report => report.log(log))
    if(this.reports.length === 0) log.info('Your project is up to date.')
  }

  onMismatchingVersion(expected, observed) {
    this._addReport(expected, observed, 'App version does not match')
  }

  onMismatchingPackage(expected, observed) {
    this._addReport(expected, observed, 'Package address does not match')
  }

  onMismatchingProvider(expected, observed) {
    this._addReport(expected, observed, 'Provider address does not match')
  }

  onMismatchingStdlib(expected, observed) {
    this._addReport(expected, observed, 'Stdlib address does not match')
  }

  onUnregisteredLocalContract(expected, observed, { alias, address }) {
    this._addReport(expected, observed, `A contract ${alias} at ${address} is not registered`)
  }

  onMissingRemoteContract(expected, observed, { alias, address }) {
    this._addReport(expected, observed, `Missing registered contract ${alias} at ${address}`)
  }

  onMismatchingContractAddress(expected, observed, { alias, address }) {
    this._addReport(expected, address, `Address for contract ${alias} does not match`)
  }

  onMismatchingContractBodyBytecode(expected, observed, { alias, address, bodyBytecodeHash }) {
    this._addReport(expected, observed, `Bytecode at ${address} for contract ${alias} does not match`)
  }

  onUnregisteredLocalProxy(expected, observed, { alias, address, implementation }) {
    this._addReport(expected, observed, `A proxy of ${alias} at ${address} pointing to ${implementation} is not registered`)
  }

  onMissingRemoteProxy(expected, observed, { alias, address, implementation }) {
    this._addReport(expected, observed, `Missing registered proxy of ${alias} at ${address} pointing to ${implementation}`)
  }

  onMismatchingProxyAlias(expected, observed, { alias, address, implementation }) {
    this._addReport(expected, observed, `Alias of proxy at ${address} pointing to ${implementation} does not match`)

  }
  onMismatchingProxyImplementation(expected, observed, { alias, address, implementation }) {
    this._addReport(expected, observed, `Pointed implementation of ${alias} proxy at ${address} does not match`)
  }

  onUnregisteredProxyImplementation(expected, observed, { address, implementation }) {
    this._addReport(expected, observed, `Proxy at ${address} is pointing to ${implementation} but given implementation is not registered in project`)
  }

  onMultipleProxyImplementations(expected, observed, { implementation }) {
    this._addReport(expected, observed, `The same implementation address ${implementation} was registered under many aliases`)
  }

  _addReport(expected, observed, description) {
    const report = new StatusReport(expected, observed, description);
    this.reports.push(report)
  }
}
