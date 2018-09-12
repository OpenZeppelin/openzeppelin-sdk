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

  function assertChanges(result, changes) {
    result.changes.should.have.lengthOf(changes.length)
    result.changes.forEach((change, index) => {
      const expected = changes[index]
      change.action.should.eq(expected.action)
      if (expected.updated) change.updated.should.include(expected.updated)
      if (expected.original) change.original.should.include(expected.original)
    })
  }

  it('reports no changes', function () {
    const result = compare('StorageMockSimpleOriginal', 'StorageMockSimpleUnchanged');
    assertChanges(result, [])
  });

  it('reports inserted var', function () {
    const result = compare('StorageMockSimpleOriginal', 'StorageMockSimpleWithInsertedVar');
    assertChanges(result, [
      { updated: { label: 'c', contract: 'StorageMockSimpleWithInsertedVar', type: 't_uint256' }, action: 'insertion' }
    ])
  });

  it('reports unshifted var', function () {
    const result = compare('StorageMockSimpleOriginal', 'StorageMockSimpleWithUnshiftedVar');
    assertChanges(result, [
      { updated: { label: 'c', contract: 'StorageMockSimpleWithUnshiftedVar', type: 't_uint256' }, action: 'insertion' }
    ])
  });

  it('reports appended var', function () {
    const result = compare('StorageMockSimpleOriginal', 'StorageMockSimpleWithAddedVar');
    assertChanges(result, [
      { updated: { label: 'c', contract: 'StorageMockSimpleWithAddedVar', type: 't_uint256' }, action: 'append' }
    ])
  });

  it('reports renamed var', function () {
    const result = compare('StorageMockSimpleOriginal', 'StorageMockSimpleWithRenamedVar');
    assertChanges(result, [
      { action: 'substitution',
        original: { label: 'b', type: 't_uint256' },
        updated:  { label: 'c', type: 't_uint256' }  }
    ])
  });

  it('reports type changed', function () {
    const result = compare('StorageMockSimpleOriginal', 'StorageMockSimpleWithTypeChanged');
    assertChanges(result, [
      { action: 'substitution',
        original: { label: 'b', type: 't_uint256' },
        updated:  { label: 'b', type: 't_string' }  }
    ])
  });

})
