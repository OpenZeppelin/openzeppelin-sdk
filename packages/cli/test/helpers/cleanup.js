import fs from 'fs'

export function cleanup(path) {
  try {
    const stat = fs.statSync(path)
    if(stat.isDirectory()) fs.rmdirSync(path)
    else fs.unlinkSync(path)
  } catch(e) { /* swallow exception */ }
}

export function cleanupfn(filename) {
  return function() {
    cleanup(filename);
  }
}
