export function tryFunc<T>(func: () => T, ifException: T = null): T {
  try {
    return func();
  } catch (_) {
    return ifException;
  }
}

export async function tryAwait<T>(
  func: () => Promise<T>,
  ifException: T = null,
): Promise<T> {
  try {
    return await func();
  } catch (_) {
    return ifException;
  }
}
