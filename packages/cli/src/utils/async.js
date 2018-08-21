import _ from 'lodash';

export async function allPromisesOrError(promisesWithObjects, toErrorMessage) {
  const failures = []
  const handlingFailure = async (item) => {
    let promise, object = null
    try {
      if (_.isArray(item)) {
        [promise, object] = item
      } else {
        promise = item
      }
      return await promise
    } catch(error) {
      failures.push([ error, object ])
      return null
    }
  };

  const results = await Promise.all(
    _.map(promisesWithObjects, handlingFailure)
  )

  if(!_.isEmpty(failures)) {
    const message = failures.map(([err, obj]) => toErrorMessage ? toErrorMessage(err, obj) : (err.message || err)).join('\n')
    throw Error(message)
  }

  return results
}