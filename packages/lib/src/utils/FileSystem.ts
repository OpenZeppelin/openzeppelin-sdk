import fs from 'fs';
import path from 'path';

// TS-TODO: Analyze which of these functions could be encapsulated.

export function ifExistsThrow(filename: string, message: string): void {
  if (exists(filename)) throw Error(message);
}

export function ifNotExistsThrow(filename: string, message: string): void {
  if (!exists(filename)) throw Error(message);
}

// TS-TODO: Returned object could be of a more specific type
export function parseJson(filename: string): any {
  return JSON.parse(read(filename));
}

export function parseJsonIfExists(filename: string): any | null {
  return exists(filename) ? JSON.parse(read(filename)) : null;
}

export function editJson(file: string, edit: ({}) => void): void {
  const data: {} = this.parseJson(file);
  edit(data);
  this.writeJson(file, data);
}

export function writeJson(filename: string, data: {}): void {
  const json: string = JSON.stringify(data, null, 2);
  write(filename, json);
}

export function copy(source: string, target: string): void {
  fs.copyFileSync(source, target);
}

export function remove(filename: string): void {
  fs.unlinkSync(filename);
}

export function removeDir(dir: string): void {
  fs.rmdirSync(dir);
}

/**
 * Remove directory recursively
 * @param {string} dirPath
 * @see https://stackoverflow.com/a/42505874/3027390
 */
export function removeTree(dirPath: string): void {
  if (exists(dirPath)) {
    readDir(dirPath).forEach(entry => {
      const entryPath: string = path.join(dirPath, entry);
      isDir(entryPath) ? removeTree(entryPath) : remove(entryPath);
    });
    removeDir(dirPath);
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
  createDirPath,
  editJson,
  parseJsonIfExists,
  writeJson,
  write,
  append,
  copy,
  remove,
  removeDir,
  removeTree,
};
