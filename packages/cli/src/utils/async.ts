import { map, isEmpty } from 'lodash';

export async function allPromisesOrError(
  promisesWithObjects: any[],
  toErrorMessage?: (error: any, object: any) => string,
): Promise<any[] | null | never> {
  const failures = [];
  const handlingFailure = async (item: any) => {
    let promise;
    let object = null;
    try {
      if (Array.isArray(item)) {
        [promise, object] = item;
      } else {
        promise = item;
      }
      return await promise;
    } catch (error) {
      failures.push({ error, object });
      return null;
    }
  };

  const results = await Promise.all(map(promisesWithObjects, handlingFailure));

  if (!isEmpty(failures)) {
    if (failures.length === 1) throw failures[0].error;
    const message = failures
      .map(({ error, object }) => (toErrorMessage ? toErrorMessage(error, object) : error.message || error))
      .join('\n');
    throw Error(message);
  }

  return results;
}
