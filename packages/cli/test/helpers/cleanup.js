import { FileSystem as fs } from '@openzeppelin/upgrades';

export function cleanup(path) {
  try {
    if (fs.isDir(path)) fs.removeTree(path);
    else fs.remove(path);
  } catch (e) {
    /* swallow exception */
  }
}

export function cleanupfn(path) {
  return function() {
    cleanup(path);
  };
}
