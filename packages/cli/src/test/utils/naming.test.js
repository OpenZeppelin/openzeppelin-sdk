'use strict';
require('../setup');

import { fromContractFullName, toContractFullName } from '../../utils/naming';

describe('naming', function() {
  describe('fromContractFullName', function() {
    const testFn = (input, expected) => () => fromContractFullName(input).should.deep.eq(expected);

    it('parses contract name', testFn('foo', { contractName: 'foo' }));
    it('parses package name', testFn('pkg/', { package: 'pkg' }));
    it('parses contract name and package name', testFn('pkg/foo', { contractName: 'foo', package: 'pkg' }));
    it('parses package name with slashes', testFn('org/pkg/foo', { contractName: 'foo', package: 'org/pkg' }));
  });

  describe('toContractFullName', function() {
    const testFn = (contract, pkg, expected) => () => toContractFullName(pkg, contract).should.eq(expected);

    it('handles no package', testFn('foo', null, 'foo'));
    it('joins package and contract', testFn('foo', 'pkg', 'pkg/foo'));
    it('handles package with slashes', testFn('foo', 'org/pkg', 'org/pkg/foo'));
  });
});
