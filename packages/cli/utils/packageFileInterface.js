import fs from 'fs'

const FILENAME = 'package.zos'

class PacakageFileInterface {
  read() {
    const blob = fs.readFileSync(FILENAME)
    return JSON.parse(blob)
  }

  write(data) {
    const blob = JSON.stringify(data, null, 2)
    fs.writeFileSync(FILENAME, blob)
  }
}


module.exports = new PacakageFileInterface()