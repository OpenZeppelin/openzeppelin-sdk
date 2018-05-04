import Stdlib from '../models/stdlib/Stdlib'
import { Logger, FileSystem as fs } from 'zos-lib'

const log = new Logger('PackageFilesInterface')

export default class PackageFilesInterface {
  constructor(packageFileName) {
    this.packageFileName = packageFileName || 'package.zos.json'
  }

  exists() {
    return fs.exists(this.packageFileName)
  }

  read() {
    return fs.parseJson(this.packageFileName)
  }

  write(zosPackage) {
    this.writeTo(this.packageFileName, zosPackage)
  }

  /*
  * Network file functions
  */

  existsNetworkFile(network) {
    const fileName = this.fileNameFor(network)
    return fs.exists(fileName)
  }

  readNetworkFile(network) {
    const fileName = this.fileNameFor(network)
    return fs.parseJson(fileName)
  }

  writeNetworkFile(network, data) {
    const fileName = this.fileNameFor(network)
    this.writeTo(fileName, data)
  }

  /*
  * Helpers
  */

  fileNameFor(network) {
    return `package.zos.${network}.json`
  }

  writeTo(fileName, zosPackage) {
    fs.writeJson(fileName, zosPackage)
    log.info(`Successfully written ${fileName}`)
  }
}
