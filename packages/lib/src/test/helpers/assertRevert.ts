import assert from 'assert';

export default async function assertRevert(promise: Promise<any>, invariants = (): void => {}) {
  try {
    await promise;
  } catch (error) {
    const revertFound = error.toString().search('revert') >= 0;
    assert(revertFound, `Expected "revert", got ${error} instead`);
    invariants();
    return;
  }

  assert.fail('Expected VM revert');
}
