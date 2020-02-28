'use strict';
require('../setup');

import { allPromisesOrError } from '../../utils/async';

describe('allPromisesOrError', function() {
  it('returns result from all promises', async function() {
    const promises = [Promise.resolve(4), Promise.resolve(6)];
    const results = await allPromisesOrError(promises);
    results.should.deep.eq([4, 6]);
  });

  it('returns result from all promises with objects', async function() {
    const promises = [
      [Promise.resolve(4), 4],
      [Promise.resolve(6), 6],
    ];
    const results = await allPromisesOrError(promises);
    results.should.deep.eq([4, 6]);
  });

  it('returns error messages from all failed promises', async function() {
    const promises = [Promise.resolve(4), Promise.reject('FAIL'), Promise.reject('FAIL2')];
    await allPromisesOrError(promises).should.be.rejectedWith('FAIL\nFAIL2');
  });

  it('customizes error messages', async function() {
    const promises = [Promise.resolve(4), Promise.reject('FAIL'), Promise.reject('FAIL2')];
    await allPromisesOrError(promises, err => `ERROR:${err}`).should.be.rejectedWith('ERROR:FAIL\nERROR:FAIL2');
  });

  it('customizes error messages with objects', async function() {
    const promises = [
      [Promise.resolve(4), 4],
      [Promise.reject('FAIL'), 1],
      [Promise.reject('FAIL2'), 2],
    ];
    await allPromisesOrError(promises, (err, obj) => `ERROR:${err}:${obj}`).should.be.rejectedWith(
      'ERROR:FAIL:1\nERROR:FAIL2:2',
    );
  });
});
