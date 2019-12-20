import fs from 'fs-extra';
import { FileSystem } from '@openzeppelin/upgrades';

export function cleanup(path) {
  try {
    if (fs.lstatSync(targetPath).isDirectory()) fs.removeSync(path);
    else fs.unlinkSync(path);
  } catch (e) {
    /* swallow exception */
  }
}

export function cleanupfn(path) {
  return function() {
    cleanup(path);
  };
}
