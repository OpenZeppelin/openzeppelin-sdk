'use strict'

require('../../setup')

import { getFunctionFromMostDerivedContract as getFunction } from '../../../src/utils/ABIs'
import Contracts from '../../../src/utils/Contracts'

const should = require('chai').should()

describe('ABIs', function() {
  describe('getFunctionFromMostDerivedContract', function () {
    it('matches number of arguments', async function () {
      testGetFunction('GetFunctionBase', [1,2], ['uint256', 'uint256']);
    });

    it('prefers function from target contract', async function () {
      testGetFunction('GetFunctionChild', ['1'], ['bytes']);
    });

    it('prefers function from most derived contract if not found in target', async function () {
      testGetFunction('GetFunctionGrandchild', ['1'], ['bytes32']);
    });

    it('prefers function from most derived contract if not found in target', async function () {
      testGetFunction('GetFunctionOtherGrandchild', ['1'], ['bytes']);
    });

    it('throws if not found', async function () {
      expect(() => testGetFunction('GetFunctionBase', [1,2,3])).to.throw("Could not find method initialize with 3 arguments in contract GetFunctionBase")
    });

    it('throws if multiple matches found', async function () {
      expect(() => testGetFunction('GetFunctionBase', [1])).to.throw("Found more than one match for function initialize with 1 arguments in contract GetFunctionBase")
    });
  });
})

function testGetFunction(contractName, args, expectedTypes) {
  const contractClass = Contracts.getFromLocal(contractName);
  const method = getFunction(contractClass, 'initialize', args);
  should.exist(method)
  method.inputs.map(m => m.type).should.be.deep.eq(expectedTypes);
}