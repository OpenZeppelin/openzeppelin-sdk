import fs from 'fs'

let fileName = 'package.zos'

class PacakageFileInterface {
  read() {
    let blob = fs.readFileSync(fileName)
    return JSON.parse(blob)
  }

  write(data) {
    let blob = JSON.stringify(data, null, 2)
    fs.writeFileSync(fileName, blob, 'utf8')
  }
}


module.exports = new PacakageFileInterface()