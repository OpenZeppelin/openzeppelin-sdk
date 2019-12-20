import { FileSystem } from '@openzeppelin/upgrades';

export function cleanup(path) {
  try {
    if (FileSystem.isDir(path)) FileSystem.removeTree(path);
    else FileSystem.remove(path);
  } catch (e) {
    /* swallow exception */
  }
}

export function cleanupfn(path) {
  return function() {
    cleanup(path);
  };
}
