import fs from 'fs'
import colors from 'colors'

const FILENAME = 'package.zos.json'

class PacakageFileInterface {
  read() {
    const data = fs.readFileSync(FILENAME)
    return JSON.parse(data)
  }

  write(zosPackage) {
    const data = JSON.stringify(zosPackage, null, 2)
    fs.writeFileSync(FILENAME, data)
    console.log(`Successfully created ${FILENAME} for ${zosPackage.name} v${zosPackage.version}`.green)
  }
}


module.exports = new PacakageFileInterface()