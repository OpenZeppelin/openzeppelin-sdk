import fs from 'fs'
import Logger from './Logger'
import Stdlib from '../models/Stdlib'
import makeContract from '../utils/contract'

const log = new Logger('PackageFilesInterface')


export default class PackageFilesInterface {
  constructor(packageFileName) {
    this.packageFileName = packageFileName || 'package.zos.json'
  }

  /*
  * Package file functions
  */

  exists() {
    return this._exists(this.packageFileName)
  }

  read() {
    return this.readFrom(this.packageFileName)
  }

  write(zosPackage) {
    this.writeTo(this.packageFileName, zosPackage)
  }

  /*
   * General functions for managing zosPackages
   * TODO: Move to a different class
   */

  async setStdlib(zosPackage, stdlibName, installDeps) {
    if (stdlibName) {
      const stdlib = new Stdlib(stdlibName)
      if (installDeps) {
        await stdlib.installDependency();
      }
      zosPackage.stdlib = {
        name: stdlib.getName(),
        version: stdlib.getVersion()
      }
    } else {
      zosPackage.stdlib = {};
    }
  }

  async getContractClass(zosPackage, contractAlias) {
    const contractName = zosPackage.contracts[contractAlias]
    if (contractName) {
      return makeContract.local(contractName)
    } else if (zosPackage.stdlib && !_.isEmpty(zosPackage.stdlib)) {
      const stdlib = new Stdlib(zosPackage.stdlib)
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
    return this._exists(fileName)
  }

  readNetworkFile(network) {
    const fileName = this.fileNameFor(network)
    return this.readFrom(fileName)
  }

  writeNetworkFile(network, data) {
    const fileName = this.fileNameFor(network)
    this.writeTo(fileName, data)
  }

  /*
  * Helpers
  */

  _exists(fileName) {
    return fs.existsSync(fileName)
  }

  fileNameFor(network) {
    return `package.zos.${network}.json`
  }

  readFrom(fileName) {
    const data = fs.readFileSync(fileName)
    return JSON.parse(data)
  }

  writeTo(fileName, zosPackage) {
    const data = JSON.stringify(zosPackage, null, 2)
    fs.writeFileSync(fileName, data)
    log.info(`Successfully written ${fileName}`)
  }
}
