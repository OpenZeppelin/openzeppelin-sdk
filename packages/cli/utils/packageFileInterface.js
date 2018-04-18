import fs from 'fs'
import colors from 'colors'


class PacakageFileInterface {
  constructor() {
    this.packageFileName = 'package.zos.json'
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

  writePackageFile(zosPackage) {
    this.writeTo(this.packageFileName, zosPackage)
  }

  readPackageFile() {
    return this.readFrom(this.packageFileName)
  }
}


module.exports = new PacakageFileInterface()