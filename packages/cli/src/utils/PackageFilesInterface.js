import fs from 'fs'
import colors from 'colors'


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
    console.log(`Successfully written ${fileName}`.green)
  }
}
