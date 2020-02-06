require('../setup');

import { getImports } from '../../src/utils/solidity';

describe('utils.solidity', function() {
  describe('getImports', function() {
    it('returns no imports from empty file', function() {
      getImports('').should.be.empty;
    });

    it.skip('returns no imports from commented out file', function() {
      getImports(`// import "Foo.sol";`).should.be.empty;
    });
  });
});
