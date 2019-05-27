export function tryFunc<T>(func: () => T, ifException: T = null): T {
  try {
    return func();
  } catch(_) {
    return ifException;
  }
}
