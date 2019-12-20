import fs from 'fs';
import path from 'path';

// TS-TODO: Analyze which of these functions could be encapsulated.

export function parseJsonIfExists(filename: string): any | null {
  return exists(filename) ? JSON.parse(read(filename)) : null;
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
