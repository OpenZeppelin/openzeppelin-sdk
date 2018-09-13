'use strict'
require('../../setup')

const should = require('chai').should()

import _ from 'lodash'

import Contracts from '../../../src/utils/Contracts'
import { getStorageLayout } from '../../../src/validations/Storage'
import { compareStorageLayouts } from '../../../src/validations/Layout'

contract('Layout', () => {
  
  function compare(originalContractName, updatedContractName) {
    return compareStorageLayouts(
      getStorageLayout(Contracts.getFromLocal(originalContractName)),
      getStorageLayout(Contracts.getFromLocal(updatedContractName))
    )
  }

  function assertChanges(result, expectedChanges) {
    result.should.have.lengthOf(expectedChanges.length)
    result.forEach((change, index) => {
      const expectedChange = expectedChanges[index]
      change.action.should.eq(expectedChange.action)
      if (expectedChange.updated) change.updated.should.include(expectedChange.updated)
      if (expectedChange.original) change.original.should.include(expectedChange.original)
    })
  }

  it('reports no changes', function () {
    const result = compare('StorageMockSimpleOriginal', 'StorageMockSimpleUnchanged');
    assertChanges(result, [])
  });

  it('reports inserted var', function () {
    const result = compare('StorageMockSimpleOriginal', 'StorageMockSimpleWithInsertedVar');
    assertChanges(result, [
      { updated: { label: 'c', contract: 'StorageMockSimpleWithInsertedVar', type: 't_uint256', index: 1 }, action: 'insert' }
    ])
  });

  it('reports unshifted var', function () {
    const result = compare('StorageMockSimpleOriginal', 'StorageMockSimpleWithUnshiftedVar');
    assertChanges(result, [
      { updated: { label: 'c', contract: 'StorageMockSimpleWithUnshiftedVar', type: 't_uint256', index: 0 }, action: 'insert' }
    ])
  });

  it('reports appended var', function () {
    const result = compare('StorageMockSimpleOriginal', 'StorageMockSimpleWithAddedVar');
    assertChanges(result, [
      { updated: { label: 'c', contract: 'StorageMockSimpleWithAddedVar', type: 't_uint256', index: 2 }, action: 'append' }
    ])
  });

  it('reports renamed var', function () {
    const result = compare('StorageMockSimpleOriginal', 'StorageMockSimpleWithRenamedVar');
    assertChanges(result, [
      { action: 'rename',
        original: { label: 'b', type: 't_uint256' },
        updated:  { label: 'c', type: 't_uint256' }  }
    ])
  });

  it('reports type changed', function () {
    const result = compare('StorageMockSimpleOriginal', 'StorageMockSimpleWithTypeChanged');
    assertChanges(result, [
      { action: 'typechange',
        original: { label: 'b', type: 't_uint256' },
        updated:  { label: 'b', type: 't_string' }  }
    ])
  });

  it('reports deleted var', function () {
    const result = compare('StorageMockSimpleOriginal', 'StorageMockSimpleWithDeletedVar');
    assertChanges(result, [
      { original: { label: 'a', contract: 'StorageMockSimpleOriginal', type: 't_uint256', index: 0 }, action: 'delete' }
    ])
  });

  it('reports popped var', function () {
    const result = compare('StorageMockSimpleOriginal', 'StorageMockSimpleWithPoppedVar');
    assertChanges(result, [
      { original: { label: 'b', contract: 'StorageMockSimpleOriginal', type: 't_uint256' }, action: 'pop' }
    ])
  });

})
