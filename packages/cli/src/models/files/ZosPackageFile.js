import _ from 'lodash'
import ZosNetworkFile from './ZosNetworkFile'
import { Logger, FileSystem as fs } from 'zos-lib'
import Stdlib from '../stdlib/Stdlib';

const log = new Logger('ZosPackageFile')

export default class ZosPackageFile {

  constructor(fileName = 'zos.json') {
    this.fileName = fileName
    this.data = fs.parseJsonIfExists(this.fileName) || { zosversion: '2' };
  }

  exists() {
    return fs.exists(this.fileName)
  }

  get lib() {
    return this.data.lib
  }

  get name() {
    return this.data.name
  }

  get version() {
    return this.data.version
  }



  get stdlib() {
    return this.data.stdlib || {}
  }

  get stdlibName() {
    return this.stdlib.name
  }

  get stdlibVersion() {
    return this.stdlib.version
  }




  get contracts() {
    return this.data.contracts || {}
  }

  get contractAliases() {
    return Object.keys(this.contracts)
  }

  get isLib() {
    return !!this.lib
  }

  contract(alias) {
    return this.contracts[alias]
  }

  hasName(name) {
    return this.name === name
  }

  hasStdlib(stdlib = undefined) {
    if (stdlib !== undefined) return this.stdlibMatches(stdlib);
    return !_.isEmpty(this.stdlib)
  }

  stdlibMatches(stdlib) {
    return _.isEmpty(this.stdlib) === _.isEmpty(stdlib)
      && this.stdlib.name === stdlib.name 
      && Stdlib.satisfiesVersion(stdlib.version, this.stdlib.version)
  }

  isCurrentVersion(version) {
    return this.version === version
  }

  hasContract(alias) {
    return !!this.contract(alias)
  }

  hasContracts() {
    return !_.isEmpty(this.contracts)
  }

  set lib(lib) {
    this.data.lib = lib
  }

  set name(name) {
   this.data.name = name
  }

  set version(version) {
    this.data.version = version
  }

  set stdlib(stdlib) {
    this.data.stdlib = stdlib
  }

  set contracts(contracts) {
    this.data.contracts = contracts
  }

  addContract(alias, name) {
    this.data.contracts[alias] = name
  }

  unsetContract(alias) {
    delete this.data.contracts[alias];
  }

  networkFile(network) {
    const networkFileName = this.fileName.replace(/\.json\s*$/, `.${network}.json`)
    if(networkFileName === this.fileName) throw Error(`Cannot create network file name from ${this.fileName}`)
    return new ZosNetworkFile(this, network, networkFileName)
  }

  write() {
    fs.writeJson(this.fileName, this.data)
    log.info(`Successfully written ${this.fileName}`)
  }
}
