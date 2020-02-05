/* eslint-disable @typescript-eslint/camelcase */
'use strict';
require('../../setup');

import util from 'util';
import { forEach, mapKeys } from 'lodash';

import Contracts from '../../../src/artifacts/Contracts';
import { getStorageLayout, getStructsOrEnums } from '../../../src/validations/Storage';

const should = require('chai').should();

describe('Storage', () => {
  function load(name) {
    beforeEach(`loading contract ${name}`, function() {
      const contractClass = Contracts.getFromLocal(name);
      const { types, storage } = getStorageLayout(contractClass);
      this.types = types;
      this.storage = storage;
    });
  }

  function checkStorage(expectedStorage) {
    it('returns storage layout', function() {
      this.storage.should.have.lengthOf(
        expectedStorage.length,
        `storage should be:\n${expectedStorage.map(util.inspect).join('\n')}\n\n      but was:\n${this.storage
          .map(util.inspect)
          .join('\n')}\n\n`,
      );
      expectedStorage.forEach((node, index) => {
        this.storage[index].should.include(node);
      });
    });
  }

  function checkTypes(expectedTypes) {
    it('returns types information', function() {
      forEach(expectedTypes, (value, id) => {
        should.exist(this.types[id], `expected types to include key ${id} but was:\n${util.inspect(this.types)}\n`);
        this.types[id].should.deep.include(value);
      });
    });
  }

  describe('on simple storage variables', function() {
    load('SimpleStorageMock');

    it('tracks src and path', function() {
      this.storage[0].src.should.match(/^133:32/);
      this.storage[0].path.should.match(/StorageMocks\.sol$/);
      this.storage[0].path.should.not.match(/^\//);
    });

    checkStorage([
      {
        label: 'my_public_uint256',
        contract: 'SimpleStorageMock',
        type: 't_uint256',
      },
      {
        label: 'my_internal_string',
        contract: 'SimpleStorageMock',
        type: 't_string',
      },
      {
        label: 'my_private_uint8',
        contract: 'SimpleStorageMock',
        type: 't_uint8',
      },
      {
        label: 'my_private_uint16',
        contract: 'SimpleStorageMock',
        type: 't_int8',
      },
      {
        label: 'my_private_bool',
        contract: 'SimpleStorageMock',
        type: 't_bool',
      },
      {
        label: 'my_private_uint',
        contract: 'SimpleStorageMock',
        type: 't_uint256',
      },
      {
        label: 'my_private_address',
        contract: 'SimpleStorageMock',
        type: 't_address',
      },
    ]);

    checkTypes({
      t_uint256: { label: 'uint256' },
      t_string: { label: 'string' },
      t_uint8: { label: 'uint8' },
      t_int8: { label: 'int8' },
      t_bool: { label: 'bool' },
      t_address: { label: 'address' },
    });
  });

  describe('on bytes', function() {
    load('StorageMockWithBytes');

    checkStorage([
      { label: 'my_bytes', contract: 'StorageMockWithBytes', type: 't_bytes' },
      {
        label: 'my_bytes8',
        contract: 'StorageMockWithBytes',
        type: 't_bytes8',
      },
      {
        label: 'my_bytes32',
        contract: 'StorageMockWithBytes',
        type: 't_bytes32',
      },
    ]);

    checkTypes({
      t_bytes: { label: 'bytes' },
      t_bytes8: { label: 'bytes8' },
      t_bytes32: { label: 'bytes32' },
    });
  });

  describe('on constants', function() {
    load('StorageMockWithConstants');
    checkStorage([]);
  });

  describe('on arrays', function() {
    load('StorageMockWithArrays');

    checkStorage([
      { label: 'my_public_uint256_dynarray', type: 't_array:dyn<t_uint256>' },
      { label: 'my_internal_string_dynarray', type: 't_array:dyn<t_string>' },
      { label: 'my_private_address_dynarray', type: 't_array:dyn<t_address>' },
      { label: 'my_public_int8_staticarray', type: 't_array:10<t_int8>' },
      { label: 'my_internal_bool_staticarray', type: 't_array:20<t_bool>' },
      { label: 'my_private_uint_staticarray', type: 't_array:30<t_uint256>' },
    ]);

    checkTypes({
      't_array:dyn<t_uint256>': { label: 'uint256[]' },
      't_array:dyn<t_string>': { label: 'string[]' },
      't_array:dyn<t_address>': { label: 'address[]' },
      't_array:10<t_int8>': { label: 'int8[10]' },
      't_array:20<t_bool>': { label: 'bool[20]' },
      't_array:30<t_uint256>': { label: 'uint256[30]' },
    });
  });

  describe('on mappings', function() {
    load('StorageMockWithMappings');

    checkStorage([
      { label: 'my_mapping', type: 't_mapping<t_string>' },
      { label: 'my_nested_mapping', type: 't_mapping<t_address>' },
      {
        label: 'my_mapping_with_arrays',
        type: 't_mapping<t_array:dyn<t_bool>>',
      },
    ]);

    checkTypes({
      't_mapping<t_string>': {
        valueType: 't_string',
        kind: 'mapping',
        label: 'mapping(key => string)',
      },
      't_mapping<t_address>': {
        valueType: 't_address',
        kind: 'mapping',
        label: 'mapping(key => address)',
      },
      't_mapping<t_array:dyn<t_bool>>': {
        valueType: 't_array:dyn<t_bool>',
        kind: 'mapping',
        label: 'mapping(key => bool[])',
      },
    });
  });

  describe('on functions', function() {
    load('StorageMockWithFunctions');

    checkStorage([
      { label: 'my_fun', type: 't_function' },
      { label: 'my_fun_dynarray', type: 't_array:dyn<t_function>' },
      { label: 'my_fun_staticarray', type: 't_array:10<t_function>' },
      { label: 'my_fun_mapping', type: 't_mapping<t_function>' },
    ]);

    checkTypes({
      't_array:10<t_function>': { label: 'function[10]' },
      't_array:dyn<t_function>': { label: 'function[]' },
      't_mapping<t_function>': {
        valueType: 't_function',
        kind: 'mapping',
        label: 'mapping(key => function)',
      },
      t_function: { label: 'function' },
    });
  });

  describe('on contracts', function() {
    load('StorageMockWithContracts');

    it('replaces contract identifier with address', function() {
      this.storage[0].type.should.eq('t_address');
    });

    checkStorage([
      { label: 'my_contract', type: 't_address' },
      { label: 'my_contract_dynarray', type: 't_array:dyn<t_address>' },
      { label: 'my_contract_staticarray', type: 't_array:10<t_address>' },
      { label: 'my_contract_mapping', type: 't_mapping<t_address>' },
      {
        label: 'my_contract_dynarray_mapping',
        type: 't_mapping<t_array:dyn<t_address>>',
      },
      {
        label: 'my_contract_staticarray_mapping',
        type: 't_mapping<t_array:10<t_address>>',
      },
    ]);

    checkTypes({
      t_address: { kind: 'elementary', label: 'address' },
      't_array:dyn<t_address>': {
        valueType: 't_address',
        length: 'dyn',
        kind: 'array',
        label: 'address[]',
      },
      't_array:10<t_address>': {
        valueType: 't_address',
        length: '10',
        kind: 'array',
        label: 'address[10]',
      },
      't_mapping<t_address>': {
        valueType: 't_address',
        kind: 'mapping',
        label: 'mapping(key => address)',
      },
      't_mapping<t_array:dyn<t_address>>': {
        valueType: 't_array:dyn<t_address>',
        kind: 'mapping',
        label: 'mapping(key => address[])',
      },
      't_mapping<t_array:10<t_address>>': {
        valueType: 't_array:10<t_address>',
        kind: 'mapping',
        label: 'mapping(key => address[10])',
      },
    });
  });

  describe('on enums', function() {
    load('StorageMockWithEnums');

    it('uses enum canonical name as type id', function() {
      this.storage[0].type.should.eq('t_enum<StorageMockWithEnums.MyEnum>');
    });

    it('tracks enum members in type definition', function() {
      const members = this.types['t_enum<StorageMockWithEnums.MyEnum>'].members;
      members.should.deep.eq(['State1', 'State2']);
    });

    checkStorage([
      { label: 'my_enum', type: 't_enum<StorageMockWithEnums.MyEnum>' },
      {
        label: 'my_enum_dynarray',
        type: 't_array:dyn<t_enum<StorageMockWithEnums.MyEnum>>',
      },
      {
        label: 'my_enum_staticarray',
        type: 't_array:10<t_enum<StorageMockWithEnums.MyEnum>>',
      },
      {
        label: 'my_enum_mapping',
        type: 't_mapping<t_enum<StorageMockWithEnums.MyEnum>>',
      },
    ]);

    checkTypes({
      't_enum<StorageMockWithEnums.MyEnum>': {
        kind: 'enum',
        label: 'StorageMockWithEnums.MyEnum',
      },
      't_array:dyn<t_enum<StorageMockWithEnums.MyEnum>>': {
        valueType: 't_enum<StorageMockWithEnums.MyEnum>',
        length: 'dyn',
        kind: 'array',
        label: 'StorageMockWithEnums.MyEnum[]',
      },
      't_array:10<t_enum<StorageMockWithEnums.MyEnum>>': {
        valueType: 't_enum<StorageMockWithEnums.MyEnum>',
        length: '10',
        kind: 'array',
        label: 'StorageMockWithEnums.MyEnum[10]',
      },
      't_mapping<t_enum<StorageMockWithEnums.MyEnum>>': {
        valueType: 't_enum<StorageMockWithEnums.MyEnum>',
        label: 'mapping(key => StorageMockWithEnums.MyEnum)',
        kind: 'mapping',
      },
    });
  });

  describe('on structs', function() {
    load('StorageMockWithStructs');

    it('uses struct canonical name as type id', function() {
      this.storage[0].type.should.eq('t_struct<StorageMockWithStructs.MyStruct>');
    });

    it('tracks struct members in type definition', function() {
      const members = this.types['t_struct<StorageMockWithStructs.MyStruct>'].members;
      members.should.have.lengthOf(3);
      members[0].should.include({ label: 'struct_uint256', type: 't_uint256' });
      members[1].should.include({ label: 'struct_string', type: 't_string' });
      members[2].should.include({ label: 'struct_address', type: 't_address' });
    });

    checkStorage([
      { label: 'my_struct', type: 't_struct<StorageMockWithStructs.MyStruct>' },
      {
        label: 'my_struct_dynarray',
        type: 't_array:dyn<t_struct<StorageMockWithStructs.MyStruct>>',
      },
      {
        label: 'my_struct_staticarray',
        type: 't_array:10<t_struct<StorageMockWithStructs.MyStruct>>',
      },
      {
        label: 'my_struct_mapping',
        type: 't_mapping<t_struct<StorageMockWithStructs.MyStruct>>',
      },
    ]);

    checkTypes({
      't_struct<StorageMockWithStructs.MyStruct>': {
        kind: 'struct',
        label: 'StorageMockWithStructs.MyStruct',
      },
      't_array:dyn<t_struct<StorageMockWithStructs.MyStruct>>': {
        valueType: 't_struct<StorageMockWithStructs.MyStruct>',
        length: 'dyn',
        kind: 'array',
        label: 'StorageMockWithStructs.MyStruct[]',
      },
      't_array:10<t_struct<StorageMockWithStructs.MyStruct>>': {
        valueType: 't_struct<StorageMockWithStructs.MyStruct>',
        length: '10',
        kind: 'array',
        label: 'StorageMockWithStructs.MyStruct[10]',
      },
      't_mapping<t_struct<StorageMockWithStructs.MyStruct>>': {
        valueType: 't_struct<StorageMockWithStructs.MyStruct>',
        label: 'mapping(key => StorageMockWithStructs.MyStruct)',
        kind: 'mapping',
      },
    });
  });

  describe('on complex structs', function() {
    load('StorageMockWithComplexStructs');

    it('tracks struct members in type definition', function() {
      const members = this.types['t_struct<StorageMockWithComplexStructs.MyStruct>'].members;
      members.should.have.lengthOf(3);
      members[0].should.include({
        label: 'uint256_dynarray',
        type: 't_array:dyn<t_uint256>',
      });
      members[1].should.include({
        label: 'mapping_enums',
        type: 't_mapping<t_enum<StorageMockWithEnums.MyEnum>>',
      });
      members[2].should.include({
        label: 'other_struct',
        type: 't_struct<StorageMockWithStructs.MyStruct>',
      });
    });

    checkStorage([
      {
        label: 'my_struct',
        type: 't_struct<StorageMockWithComplexStructs.MyStruct>',
      },
      {
        label: 'my_other_struct',
        type: 't_struct<StorageMockWithStructs.MyStruct>',
      },
    ]);
  });

  describe('on recursive structs', function() {
    load('StorageMockWithRecursiveStructs');

    it('tracks struct members in type definition', function() {
      const members = this.types['t_struct<StorageMockWithRecursiveStructs.MyStruct>'].members;
      members.should.have.lengthOf(1);
      members[0].should.include({
        label: 'other_structs',
        type: 't_array:dyn<t_struct<StorageMockWithRecursiveStructs.OtherStruct>>',
      });
    });

    checkStorage([
      {
        label: 'my_struct',
        type: 't_struct<StorageMockWithRecursiveStructs.MyStruct>',
      },
    ]);

    checkTypes({
      't_struct<StorageMockWithRecursiveStructs.MyStruct>': {
        kind: 'struct',
        label: 'StorageMockWithRecursiveStructs.MyStruct',
      },
      't_struct<StorageMockWithRecursiveStructs.OtherStruct>': {
        kind: 'struct',
        label: 'StorageMockWithRecursiveStructs.OtherStruct',
      },
    });
  });

  for (const contractName of [
    'StorageMockWithReferences',
    'StorageMockWithTransitiveReferences',
    'StorageMockWithNodeModulesReferences',
  ]) {
    describe(`on references to other files in ${contractName}`, function() {
      load(contractName);

      const structScope =
        contractName === 'StorageMockWithNodeModulesReferences' ? 'DependencyStorageMock' : 'StorageMockWithStructs';
      const enumScope =
        contractName === 'StorageMockWithNodeModulesReferences' ? 'DependencyStorageMock' : 'StorageMockWithEnums';

      checkStorage([
        { label: 'my_enum', type: `t_enum<${enumScope}.MyEnum>` },
        { label: 'my_struct', type: `t_struct<${structScope}.MyStruct>` },
        { label: 'my_contract', type: 't_address' },
      ]);

      checkTypes({
        [`t_struct<${structScope}.MyStruct>`]: {
          kind: 'struct',
          label: `${structScope}.MyStruct`,
        },
        [`t_enum<${enumScope}.MyEnum>`]: {
          kind: 'enum',
          label: `${enumScope}.MyEnum`,
          members: ['State1', 'State2'],
        },
      });
    });
  }

  describe('on inheritance chain', function() {
    load('StorageMockChainChild');

    it('assigns slots according to linearization', async function() {
      const StorageMockChainChild = Contracts.getFromLib('StorageMockChainChild');
      const instance = await StorageMockChainChild.new();
      const slots = await instance.methods.slots().call();
      const mappedSlots = [];
      mapKeys(slots, (value, key) => {
        if (isNaN(parseInt(key, 10))) mappedSlots.push(parseInt(value, 10));
      });
      mappedSlots.should.deep.eq([0, 1, 3, 5, 7]);
    });

    checkStorage([
      { label: 'base', type: 't_uint256', contract: 'StorageMockChainBase' },
      { label: 'a1', type: 't_uint256', contract: 'StorageMockChainA1' },
      { label: 'a2', type: 't_uint256', contract: 'StorageMockChainA1' },
      { label: 'a3', type: 't_uint256', contract: 'StorageMockChainA2' },
      { label: 'a4', type: 't_uint256', contract: 'StorageMockChainA2' },
      { label: 'b1', type: 't_uint256', contract: 'StorageMockChainB' },
      { label: 'b2', type: 't_uint256', contract: 'StorageMockChainB' },
      { label: 'child', type: 't_uint256', contract: 'StorageMockChainChild' },
    ]);

    checkTypes({ t_uint256: { label: 'uint256' } });
  });

  describe('#getStructsOrEnums', function() {
    it('returns all structs and enums from complex contract', function() {
      const storageInfo = getStorageLayout(Contracts.getFromLib('StorageMockMixed'));
      const result = getStructsOrEnums(storageInfo);
      const resultVarNames = result.map(variable => variable.label);

      resultVarNames.should.be.deep.eq([
        'my_struct',
        'my_struct_dynarray',
        'my_struct_staticarray',
        'my_struct_mapping',
        'my_enum',
        'my_enum_dynarray',
        'my_enum_staticarray',
        'my_enum_mapping',
      ]);
    });

    it('returns none from mappings contract', function() {
      const storageInfo = getStorageLayout(Contracts.getFromLib('StorageMockWithMappings'));
      const result = getStructsOrEnums(storageInfo);
      const resultVarNames = result.map(variable => variable.label);

      resultVarNames.should.be.deep.eq([]);
    });

    it('returns none from arrays contract', function() {
      const storageInfo = getStorageLayout(Contracts.getFromLib('StorageMockWithArrays'));
      const result = getStructsOrEnums(storageInfo);
      const resultVarNames = result.map(variable => variable.label);

      resultVarNames.should.be.deep.eq([]);
    });

    it('returns struct from structs contract', function() {
      const storageInfo = getStorageLayout(Contracts.getFromLib('StorageMockWithStructs'));
      const result = getStructsOrEnums(storageInfo);
      const resultVarNames = result.map(variable => variable.label);

      resultVarNames.should.be.deep.eq([
        'my_struct',
        'my_struct_dynarray',
        'my_struct_staticarray',
        'my_struct_mapping',
      ]);
    });
  });
});
