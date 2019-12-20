import fs from 'fs';
import path from 'path';

// TS-TODO: Analyze which of these functions could be encapsulated.

export function parseJsonIfExists(filename: string): any | null {
  return exists(filename) ? JSON.parse(read(filename)) : null;
}

export function editJson(file: string, edit: ({}) => void): void {
  const data: {} = this.parseJson(file);
  edit(data);
  this.writeJson(file, data);
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
