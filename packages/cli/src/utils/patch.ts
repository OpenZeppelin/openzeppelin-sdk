// in order to properly stub and mock libs which export function by default
// more https://github.com/sinonjs/sinon/issues/562

export const cache: object = {};

export default function(lib: string) {
  const module = require(lib);
  if (!cache.hasOwnProperty(lib)) cache[lib] = module;
  return (...args: any[]) => cache[lib].apply(this, args);
}
