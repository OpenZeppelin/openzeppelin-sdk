'use strict';

require('../setup');

import { getNetwork, setNetwork } from '../../src/scripts/session';

describe('session', function () {
  describe('getNetwork/setNetwork', function () {
    it('setNetwork should not throw', () => setNetwork({close : true}));

    it('getNetwork should return undefined',
      () => (getNetwork() || 'undefined').should.deep.eq('undefined'));

    it('setNetwork should not throw', () => setNetwork({ network: 'foo' }));

    it('getNetwork should return foo', () => getNetwork().should.deep.eq('foo'));

    it('setNetwork should throw', function() {
      let error = '';
      try {
        setNetwork({});
      } catch(e) {
        error = e;
      }
      error.toString().should.deep.eq(
        'Error: Please provide either --network <network> or --close.');
    });

    it('setNetwork should throw', function() {
      let error = '';
      try {
        setNetwork({ network: 'foo', close: true });
      } catch(e) {
        error = e;
      }
      error.toString().should.deep.eq(
        'Error: Please provide either --network <network> or --close.');
    });

    // to remove .zos.session
    it('setNetwork should not throw', () => setNetwork({close : true}));
  });
});
