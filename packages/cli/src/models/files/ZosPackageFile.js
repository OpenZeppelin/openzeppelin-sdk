import _ from 'lodash'
import ZosNetworkFile from './ZosNetworkFile'
import { Logger, FileSystem as fs } from 'zos-lib'

const log = new Logger('ZosPackageFile')

export default class ZosPackageFile {

  constructor(fileName = 'zos.json') {
    this.fileName = fileName
    this.data = fs.parseJsonIfExists(this.fileName) || {};
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
    return this.data.stdlib
  }

  get stdlibName() {
    return this.stdlib.name
  }

  get stdlibVersion() {
    return this.stdlib.version
  }

  get contracts() {
    return this.data.contracts
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
    if(stdlib === undefined) return !_.isEmpty(this.stdlib)
    return this.stdlib.name === stdlib.name && this.stdlib.version === stdlib.version
  }

  isCurrentVersion(version) {
    return this.version === version
  }

  hasContract(alias) {
    return !!this.contract(alias)
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

  setContract(alias, name) {
    this.data.contracts[alias] = name
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
