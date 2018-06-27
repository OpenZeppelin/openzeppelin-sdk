import fs from 'fs'
import path from 'path'

export function read(filename) {
  return fs.readFileSync(filename)
}

export function readDir(dir) {
  return fs.readdirSync(dir)
}

export function exists(filename) {
  return fs.existsSync(filename)
}

export function createDir(dir) {
  fs.mkdirSync(dir)
}

export function isDir(path) {
  return fs.lstatSync(path).isDirectory()
}

export function ifExistsThrow(filename, message) {
  if(exists(filename)) throw Error(message)
}

export function ifNotExistsThrow(filename, message) {
  if(!exists(filename)) throw Error(message)
}

export function parseJson(filename) {
  return JSON.parse(read(filename))
}

export function parseJsonIfExists(filename) {
  if (exists(filename)) {
    return JSON.parse(read(filename))
  }
}

export function editJson(file, edit) {
  const data = this.parseJson(file)
  edit(data)
  this.writeJson(file, data)
}

export function writeJson(filename, data) {
  const json = JSON.stringify(data, null, 2)
  write(filename, json)
}

export function write(filename, data) {
  fs.writeFileSync(filename, data)
}

export function append(filename, data) {
  fs.appendFileSync(filename, data)
}

export function copy(source, target) {
  fs.copyFileSync(source, target)
}

export function remove(filename) {
  fs.unlinkSync(filename)
}

export function removeDir(dir) {
  fs.rmdirSync(dir)
}

/**
 * Remove directory recursively
 * @param {string} dirPath
 * @see https://stackoverflow.com/a/42505874/3027390
 */
export function removeTree(dirPath) {
  if (exists(dirPath)) {
    readDir(dirPath).forEach(entry => {
      const entryPath = path.join(dirPath, entry)
      isDir(entryPath) ? removeTree(entryPath) : remove(entryPath)
    })
    removeDir(dirPath)
  }
}

export default {
  read,
  readDir,
  isDir,
  exists,
  ifExistsThrow,
  ifNotExistsThrow,
  parseJson,
  createDir,
  editJson,
  parseJsonIfExists,
  writeJson,
  write,
  append,
  copy,
  remove,
  removeDir,
  removeTree
}
