import fs from 'fs'
import colors from 'colors'


class PacakageFileInterface {
  constructor() {
    this.packageFileName = 'package.zos.json'
  }

  /*
  * Package file functions
  */

  read() {
    return this.readFrom(this.packageFileName)
  }

  write(zosPackage) {
    this.writeTo(this.packageFileName, zosPackage)
  }

  /*
  * Network file functions
  */

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


module.exports = new PacakageFileInterface()