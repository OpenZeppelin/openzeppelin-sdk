import fs from 'fs';

export function cleanup(filename) {
  try {
    fs.unlinkSync(filename);
  } catch(e) { /* swallow exception */ }
}

export function cleanupfn(filename) {
  return function() {
    cleanup(filename);
  }
}
