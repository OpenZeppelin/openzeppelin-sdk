import fs from 'fs-extra';

export function cleanup(path) {
  try {
    fs.removeSync(path);
  } catch (e) {
    /* swallow exception */
  }
}

export function cleanupfn(path) {
  return function() {
    cleanup(path);
  };
}
