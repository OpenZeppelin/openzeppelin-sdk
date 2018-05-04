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
   * General functions for managing zosPackages
   * TODO: Move to a different class
   */

  async setStdlib(zosPackage, stdlib) {
    zosPackage.stdlib = {
      name: stdlib.getName(),
      version: stdlib.getVersion()
    }
  }

  async getContractClass(zosPackage, contractAlias) {
    const contractName = zosPackage.contracts[contractAlias]
    if (contractName) {
      return ContractsProvider.getFromArtifacts(contractName)
    } else if (!_.isEmpty(zosPackage.stdlib)) {
      const stdlib = new Stdlib(zosPackage.stdlib.name)
      return await stdlib.getContract(contractAlias);
    } else {
      throw `Could not find ${contractAlias} contract in zOS package file`
    }
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
