import fs from 'fs'

export default {
  read(filename) {
    return fs.readFileSync(filename)
  },

  exists(filename) {
    return fs.existsSync(filename)
  },

  parseJson(filename) {
    return JSON.parse(this.read(filename))
  },

  writeJson(filename, data) {
    const json = JSON.stringify(data, null, 2)
    fs.writeFileSync(filename, json)
  }
}
