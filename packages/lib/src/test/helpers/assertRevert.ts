import assert from 'assert';

export default async function assertRevert(promise: Promise<any>, invariants = (): void => {}) {
  try {
    await promise;
    assert.fail('Expected revert not received');
  } catch (error) {
    const revertFound = error.toString().search('revert') >= 0;
    assert(revertFound, `Expected "revert", got ${error} instead`);
    invariants();
  }
}
