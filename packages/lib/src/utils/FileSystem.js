import fs from 'fs'

export function read(filename) {
  return fs.readFileSync(filename)
}

export function exists(filename) {
  return fs.existsSync(filename)
}

export function parseJson(filename) {
  return JSON.parse(read(filename))
}

export function parseJsonIfExists(filename) {
  if (exists(filename)) {
    return JSON.parse(read(filename))
  }
}

export function writeJson(filename, data) {
  const json = JSON.stringify(data, null, 2)
  fs.writeFileSync(filename, json)
}

export default {
  read,
  exists,
  parseJson,
  parseJsonIfExists,
  writeJson
}
