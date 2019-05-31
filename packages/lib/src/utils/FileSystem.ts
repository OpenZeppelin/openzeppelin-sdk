import fs from 'fs';
import path from 'path';

// TS-TODO: Analyze which of these functions could be encapsulated.

export function read(filename: string): string {
  return fs.readFileSync(filename, { encoding: 'utf8' });
}

export function readDir(dir: string): string[] {
  return fs.readdirSync(dir, { encoding: 'utf8' });
}

export function exists(filename: string): boolean {
  return fs.existsSync(filename);
}

export function createDir(dir: string): void {
  fs.mkdirSync(dir);
}

export function createDirPath(dirPath: string): void {
  const folders = dirPath.split('/');
  folders.reduce((subDir, folder) => {
    const subFolderPath = `${subDir}/${folder}`;
    if (folder && !exists(subFolderPath)) createDir(subFolderPath);
    return subFolderPath;
  }, '');
}

export function isDir(targetPath: string): boolean {
  return fs.lstatSync(targetPath).isDirectory();
}

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

export function write(filename: string, data: string): void {
  fs.writeFileSync(filename, data);
}

export function append(filename: string, data: string): void {
  fs.appendFileSync(filename, data);
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
