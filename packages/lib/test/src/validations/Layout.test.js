'use strict';
require('../../setup');

const should = require('chai').should();

import Contracts from '../../../src/artifacts/Contracts';
import { getStorageLayout } from '../../../src/validations/Storage';
import { compareStorageLayouts } from '../../../src/validations/Layout';

contract('Layout', () => {
  function compare(originalContractName, updatedContractName) {
    return compareStorageLayouts(
      getStorageLayout(Contracts.getFromLocal(originalContractName)),
      getStorageLayout(Contracts.getFromLocal(updatedContractName)),
    );
  }

  function assertChanges(result, expectedChanges) {
    result.should.have.lengthOf(expectedChanges.length);
    result.forEach((change, index) => {
      const expectedChange = expectedChanges[index];
      change.action.should.eq(expectedChange.action);
      if (expectedChange.updated)
        change.updated.should.include(expectedChange.updated);
      if (expectedChange.original)
        change.original.should.include(expectedChange.original);
    });
  }

  it('reports no changes', function() {
    const result = compare(
      'StorageMockSimpleOriginal',
      'StorageMockSimpleUnchanged',
    );
    assertChanges(result, []);
  });

  it('reports inserted var', function() {
    const result = compare(
      'StorageMockSimpleOriginal',
      'StorageMockSimpleWithInsertedVar',
    );
    assertChanges(result, [
      {
        updated: {
          label: 'c',
          contract: 'StorageMockSimpleWithInsertedVar',
          type: 't_uint256',
          index: 1,
        },
        action: 'insert',
      },
    ]);
  });

  it('reports unshifted var', function() {
    const result = compare(
      'StorageMockSimpleOriginal',
      'StorageMockSimpleWithUnshiftedVar',
    );
    assertChanges(result, [
      {
        updated: {
          label: 'c',
          contract: 'StorageMockSimpleWithUnshiftedVar',
          type: 't_uint256',
          index: 0,
        },
        action: 'insert',
      },
    ]);
  });

  it('reports appended var', function() {
    const result = compare(
      'StorageMockSimpleOriginal',
      'StorageMockSimpleWithAddedVar',
    );
    assertChanges(result, [
      {
        updated: {
          label: 'c',
          contract: 'StorageMockSimpleWithAddedVar',
          type: 't_uint256',
          index: 2,
        },
        action: 'append',
      },
    ]);
  });

  it('reports renamed var', function() {
    const result = compare(
      'StorageMockSimpleOriginal',
      'StorageMockSimpleWithRenamedVar',
    );
    assertChanges(result, [
      {
        action: 'rename',
        original: { label: 'b', type: 't_uint256' },
        updated: { label: 'c', type: 't_uint256' },
      },
    ]);
  });

  it('reports type changed', function() {
    const result = compare(
      'StorageMockSimpleOriginal',
      'StorageMockSimpleWithTypeChanged',
    );
    assertChanges(result, [
      {
        action: 'typechange',
        original: { label: 'b', type: 't_uint256' },
        updated: { label: 'b', type: 't_string' },
      },
    ]);
  });

  it('reports deleted var', function() {
    const result = compare(
      'StorageMockSimpleOriginal',
      'StorageMockSimpleWithDeletedVar',
    );
    assertChanges(result, [
      {
        original: {
          label: 'a',
          contract: 'StorageMockSimpleOriginal',
          type: 't_uint256',
          index: 0,
        },
        action: 'delete',
      },
    ]);
  });

  it('reports popped var', function() {
    const result = compare(
      'StorageMockSimpleOriginal',
      'StorageMockSimpleWithPoppedVar',
    );
    assertChanges(result, [
      {
        original: {
          label: 'b',
          contract: 'StorageMockSimpleOriginal',
          type: 't_uint256',
        },
        action: 'pop',
      },
    ]);
  });

  it('reports replaced var', function() {
    const result = compare(
      'StorageMockSimpleOriginal',
      'StorageMockSimpleWithReplacedVar',
    );
    assertChanges(result, [
      {
        action: 'replace',
        original: { label: 'b', type: 't_uint256' },
        updated: { label: 'c', type: 't_string' },
      },
    ]);
  });

  it('reports no changes on complex contract', function() {
    const result = compare(
      'StorageMockComplexOriginal',
      'StorageMockComplexOriginal',
    );
    assertChanges(result, []);
  });

  it('reports changes and appended', function() {
    const result = compare(
      'StorageMockSimpleOriginal',
      'StorageMockSimpleChangedWithAppendedVar',
    );
    assertChanges(result, [
      {
        action: 'rename',
        original: { label: 'a', type: 't_uint256' },
        updated: { label: 'a2', type: 't_uint256' },
      },
      {
        action: 'rename',
        original: { label: 'b', type: 't_uint256' },
        updated: { label: 'b2', type: 't_uint256' },
      },
      { action: 'append', updated: { label: 'c2', type: 't_uint256' } },
    ]);
  });

  it('handles empty contracts', function() {
    const result = compare('StorageMockEmpty', 'StorageMockEmpty');
    assertChanges(result, []);
  });

  it('handles original empty contract', function() {
    const result = compare('StorageMockEmpty', 'StorageMockSimpleOriginal');
    assertChanges(result, [
      { action: 'append', updated: { label: 'a', type: 't_uint256' } },
      { action: 'append', updated: { label: 'b', type: 't_uint256' } },
    ]);
  });

  it('handles target empty contract', function() {
    const result = compare('StorageMockSimpleOriginal', 'StorageMockEmpty');
    assertChanges(result, [
      { action: 'pop', original: { label: 'a', type: 't_uint256' } },
      { action: 'pop', original: { label: 'b', type: 't_uint256' } },
    ]);
  });

  it('reports append and not insert on variable added with repeated name in most derived contract', function() {
    const result = compare(
      'StorageMockChainPrivateChildV1',
      'StorageMockChainPrivateChildV2',
    );
    assertChanges(result, [
      {
        action: 'append',
        updated: {
          contract: 'StorageMockChainPrivateChildV2',
          label: 'a',
          type: 't_uint256',
        },
      },
    ]);
  });

  it('regression test for false insert error openzeppelin-eth 2.1.2 standalone erc20', function() {
    const result = compareStorageLayouts(
      {
        types: {
          t_bool: { id: 't_bool', kind: 'elementary', label: 'bool' },
          t_uint256: { id: 't_uint256', kind: 'elementary', label: 'uint256' },
          't_array:50<t_uint256>': {
            id: 't_array:50<t_uint256>',
            valueType: 't_uint256',
            length: '50',
            kind: 'array',
            label: 'uint256[50]',
          },
          t_string: { id: 't_string', kind: 'elementary', label: 'string' },
          t_uint8: { id: 't_uint8', kind: 'elementary', label: 'uint8' },
          't_mapping<t_uint256>': {
            id: 't_mapping<t_uint256>',
            valueType: 't_uint256',
            label: 'mapping(key => uint256)',
            kind: 'mapping',
          },
          't_struct<Roles.Role>': {
            id: 't_struct<Roles.Role>',
            kind: 'struct',
            label: 'Roles.Role',
            members: [
              {
                label: 'bearer',
                astId: 5,
                type: 't_mapping<t_bool>',
                src: '146:32:0',
              },
            ],
          },
          't_mapping<t_bool>': {
            id: 't_mapping<t_bool>',
            valueType: 't_bool',
            label: 'mapping(key => bool)',
            kind: 'mapping',
          },
        },
        storage: [
          {
            contract: 'Initializable',
            path: 'zos-lib/contracts/Initializable.sol',
            label: 'initialized',
            astId: 9771,
            type: 't_bool',
            src: '749:24:120',
          },
          {
            contract: 'Initializable',
            path: 'zos-lib/contracts/Initializable.sol',
            label: 'initializing',
            astId: 9773,
            type: 't_bool',
            src: '868:25:120',
          },
          {
            contract: 'Initializable',
            path: 'zos-lib/contracts/Initializable.sol',
            label: '______gap',
            astId: 9822,
            type: 't_array:50<t_uint256>',
            src: '1883:29:120',
          },
          {
            contract: 'ERC20Detailed',
            path: 'contracts/token/ERC20/ERC20Detailed.sol',
            label: '_name',
            astId: 7719,
            type: 't_string',
            src: '382:20:98',
          },
          {
            contract: 'ERC20Detailed',
            path: 'contracts/token/ERC20/ERC20Detailed.sol',
            label: '_symbol',
            astId: 7721,
            type: 't_string',
            src: '406:22:98',
          },
          {
            contract: 'ERC20Detailed',
            path: 'contracts/token/ERC20/ERC20Detailed.sol',
            label: '_decimals',
            astId: 7723,
            type: 't_uint8',
            src: '432:23:98',
          },
          {
            contract: 'ERC20Detailed',
            path: 'contracts/token/ERC20/ERC20Detailed.sol',
            label: '______gap',
            astId: 7775,
            type: 't_array:50<t_uint256>',
            src: '1002:29:98',
          },
          {
            contract: 'ERC20',
            path: 'contracts/token/ERC20/ERC20.sol',
            label: '_balances',
            astId: 7161,
            type: 't_mapping<t_uint256>',
            src: '491:46:95',
          },
          {
            contract: 'ERC20',
            path: 'contracts/token/ERC20/ERC20.sol',
            label: '_allowed',
            astId: 7167,
            type: 't_mapping<t_uint256>',
            src: '542:66:95',
          },
          {
            contract: 'ERC20',
            path: 'contracts/token/ERC20/ERC20.sol',
            label: '_totalSupply',
            astId: 7169,
            type: 't_uint256',
            src: '613:28:95',
          },
          {
            contract: 'ERC20',
            path: 'contracts/token/ERC20/ERC20.sol',
            label: '______gap',
            astId: 7595,
            type: 't_array:50<t_uint256>',
            src: '7048:29:95',
          },
          {
            contract: 'MinterRole',
            path: 'contracts/access/roles/MinterRole.sol',
            label: 'minters',
            astId: 216,
            type: 't_struct<Roles.Role>',
            src: '264:26:2',
          },
          {
            contract: 'MinterRole',
            path: 'contracts/access/roles/MinterRole.sol',
            label: '______gap',
            astId: 315,
            type: 't_array:50<t_uint256>',
            src: '990:29:2',
          },
          {
            contract: 'ERC20Mintable',
            path: 'contracts/token/ERC20/ERC20Mintable.sol',
            label: '______gap',
            astId: 7824,
            type: 't_array:50<t_uint256>',
            src: '742:29:99',
          },
          {
            contract: 'PauserRole',
            path: 'contracts/access/roles/PauserRole.sol',
            label: 'pausers',
            astId: 335,
            type: 't_struct<Roles.Role>',
            src: '264:26:3',
          },
          {
            contract: 'PauserRole',
            path: 'contracts/access/roles/PauserRole.sol',
            label: '______gap',
            astId: 434,
            type: 't_array:50<t_uint256>',
            src: '990:29:3',
          },
          {
            contract: 'Pausable',
            path: 'contracts/lifecycle/Pausable.sol',
            label: '_paused',
            astId: 3558,
            type: 't_bool',
            src: '318:28:30',
          },
          {
            contract: 'Pausable',
            path: 'contracts/lifecycle/Pausable.sol',
            label: '______gap',
            astId: 3631,
            type: 't_array:50<t_uint256>',
            src: '1260:29:30',
          },
          {
            contract: 'ERC20Pausable',
            path: 'contracts/token/ERC20/ERC20Pausable.sol',
            label: '______gap',
            astId: 7947,
            type: 't_array:50<t_uint256>',
            src: '1282:29:100',
          },
        ],
        warnings: {
          hasConstructor: false,
          hasSelfDestruct: false,
          hasDelegateCall: false,
          hasInitialValuesInDeclarations: false,
          uninitializedBaseContracts: [],
        },
      },
      {
        types: {
          t_bool: { id: 't_bool', kind: 'elementary', label: 'bool' },
          t_uint256: { id: 't_uint256', kind: 'elementary', label: 'uint256' },
          't_array:50<t_uint256>': {
            id: 't_array:50<t_uint256>',
            valueType: 't_uint256',
            length: '50',
            kind: 'array',
            label: 'uint256[50]',
          },
          t_string: { id: 't_string', kind: 'elementary', label: 'string' },
          t_uint8: { id: 't_uint8', kind: 'elementary', label: 'uint8' },
          't_mapping<t_uint256>': {
            id: 't_mapping<t_uint256>',
            valueType: 't_uint256',
            label: 'mapping(key => uint256)',
            kind: 'mapping',
          },
          't_struct<Roles.Role>': {
            id: 't_struct<Roles.Role>',
            kind: 'struct',
            label: 'Roles.Role',
            members: [
              {
                label: 'bearer',
                astId: 5,
                type: 't_mapping<t_bool>',
                src: '150:32:0',
              },
            ],
          },
          't_mapping<t_bool>': {
            id: 't_mapping<t_bool>',
            valueType: 't_bool',
            label: 'mapping(key => bool)',
            kind: 'mapping',
          },
        },
        storage: [
          {
            contract: 'Initializable',
            path: 'zos-lib/contracts/Initializable.sol',
            label: 'initialized',
            astId: 11438,
            type: 't_bool',
            src: '757:24:139',
          },
          {
            contract: 'Initializable',
            path: 'zos-lib/contracts/Initializable.sol',
            label: 'initializing',
            astId: 11440,
            type: 't_bool',
            src: '876:25:139',
          },
          {
            contract: 'Initializable',
            path: 'zos-lib/contracts/Initializable.sol',
            label: '______gap',
            astId: 11489,
            type: 't_array:50<t_uint256>',
            src: '1891:29:139',
          },
          {
            contract: 'ERC20Detailed',
            path: 'contracts/token/ERC20/ERC20Detailed.sol',
            label: '_name',
            astId: 8827,
            type: 't_string',
            src: '382:20:114',
          },
          {
            contract: 'ERC20Detailed',
            path: 'contracts/token/ERC20/ERC20Detailed.sol',
            label: '_symbol',
            astId: 8829,
            type: 't_string',
            src: '408:22:114',
          },
          {
            contract: 'ERC20Detailed',
            path: 'contracts/token/ERC20/ERC20Detailed.sol',
            label: '_decimals',
            astId: 8831,
            type: 't_uint8',
            src: '436:23:114',
          },
          {
            contract: 'ERC20Detailed',
            path: 'contracts/token/ERC20/ERC20Detailed.sol',
            label: '______gap',
            astId: 8883,
            type: 't_array:50<t_uint256>',
            src: '1097:29:114',
          },
          {
            contract: 'ERC20',
            path: 'contracts/token/ERC20/ERC20.sol',
            label: '_balances',
            astId: 8282,
            type: 't_mapping<t_uint256>',
            src: '774:46:111',
          },
          {
            contract: 'ERC20',
            path: 'contracts/token/ERC20/ERC20.sol',
            label: '_allowed',
            astId: 8288,
            type: 't_mapping<t_uint256>',
            src: '827:66:111',
          },
          {
            contract: 'ERC20',
            path: 'contracts/token/ERC20/ERC20.sol',
            label: '_totalSupply',
            astId: 8290,
            type: 't_uint256',
            src: '900:28:111',
          },
          {
            contract: 'ERC20',
            path: 'contracts/token/ERC20/ERC20.sol',
            label: '______gap',
            astId: 8704,
            type: 't_array:50<t_uint256>',
            src: '7661:29:111',
          },
          {
            contract: 'MinterRole',
            path: 'contracts/access/roles/MinterRole.sol',
            label: '_minters',
            astId: 231,
            type: 't_struct<Roles.Role>',
            src: '271:27:2',
          },
          {
            contract: 'MinterRole',
            path: 'contracts/access/roles/MinterRole.sol',
            label: '______gap',
            astId: 330,
            type: 't_array:50<t_uint256>',
            src: '1081:29:2',
          },
          {
            contract: 'ERC20Mintable',
            path: 'contracts/token/ERC20/ERC20Mintable.sol',
            label: '______gap',
            astId: 8932,
            type: 't_array:50<t_uint256>',
            src: '745:29:115',
          },
          {
            contract: 'PauserRole',
            path: 'contracts/access/roles/PauserRole.sol',
            label: '_pausers',
            astId: 350,
            type: 't_struct<Roles.Role>',
            src: '271:27:3',
          },
          {
            contract: 'PauserRole',
            path: 'contracts/access/roles/PauserRole.sol',
            label: '______gap',
            astId: 449,
            type: 't_array:50<t_uint256>',
            src: '1081:29:3',
          },
          {
            contract: 'Pausable',
            path: 'contracts/lifecycle/Pausable.sol',
            label: '_paused',
            astId: 3907,
            type: 't_bool',
            src: '352:20:34',
          },
          {
            contract: 'Pausable',
            path: 'contracts/lifecycle/Pausable.sol',
            label: '______gap',
            astId: 3988,
            type: 't_array:50<t_uint256>',
            src: '1429:29:34',
          },
          {
            contract: 'ERC20Pausable',
            path: 'contracts/token/ERC20/ERC20Pausable.sol',
            label: '______gap',
            astId: 9055,
            type: 't_array:50<t_uint256>',
            src: '1195:29:116',
          },
          {
            contract: 'StandaloneERC20',
            path: 'contracts/token/ERC20/StandaloneERC20.sol',
            label: '______gap',
            astId: 9468,
            type: 't_array:50<t_uint256>',
            src: '2076:29:119',
          },
        ],
      },
    );

    assertChanges(result, [
      {
        action: 'rename',
        updated: {
          contract: 'MinterRole',
          label: '_minters',
          type: 't_struct<Roles.Role>',
        },
        original: {
          contract: 'MinterRole',
          label: 'minters',
          type: 't_struct<Roles.Role>',
        },
      },
      {
        action: 'rename',
        updated: {
          contract: 'PauserRole',
          label: '_pausers',
          type: 't_struct<Roles.Role>',
        },
        original: {
          contract: 'PauserRole',
          label: 'pausers',
          type: 't_struct<Roles.Role>',
        },
      },
      {
        action: 'append',
        updated: {
          contract: 'StandaloneERC20',
          label: '______gap',
          type: 't_array:50<t_uint256>',
        },
      },
    ]);
  });
});
