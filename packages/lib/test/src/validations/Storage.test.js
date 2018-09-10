'use strict'
require('../../setup')

const should = require('chai').should()
const util = require('util')

import _ from 'lodash'

import Contracts from '../../../src/utils/Contracts'
import { getStorageLayout } from '../../../src/validations/Storage'

contract('Storage', () => {
  
  before('set auxiliary functions', function () {
    this.getStorageLayout = (name) => {
      const contractClass = Contracts.getFromLocal(name)
      const { types, storage } = getStorageLayout(contractClass)
      this.types = types
      this.storage = storage
    }

    this.assertStorage = (expectedStorage) => {
      this.storage.should.have.lengthOf(expectedStorage.length, `storage should have:\n${expectedStorage.map(util.inspect).join('\n')}\n\n      but was:\n${this.storage.map(util.inspect).join('\n')}\n`)
      expectedStorage.forEach((node, index) => {
        this.storage[index].should.include(node)
      })
    }

    this.assertTypes = (expectedTypes) => {
      _.forEach(expectedTypes, (value, id) => {
        should.exist(this.types[id], `expected types to include key ${id} but was:\n${util.inspect(this.types)}\n`)
        this.types[id].should.include(value)
      })
    }
  })

  describe('on simple storage variables', function () {
    beforeEach(function () {
      this.getStorageLayout('SimpleStorageMock')
    })

    it('returns storage', function () {
      const expectedStorage = [ 
        { label: 'my_public_uint256', contract: 'SimpleStorageMock', type: 't_uint256' },
        { label: 'my_internal_string', contract: 'SimpleStorageMock', type: 't_string' },
        { label: 'my_private_uint8', contract: 'SimpleStorageMock', type: 't_uint8' },
        { label: 'my_private_uint16', contract: 'SimpleStorageMock', type: 't_int8' },
        { label: 'my_private_bool', contract: 'SimpleStorageMock', type: 't_bool' },
        { label: 'my_private_uint', contract: 'SimpleStorageMock', type: 't_uint256' },
        { label: 'my_private_address', contract: 'SimpleStorageMock', type: 't_address' } 
      ]

      this.assertStorage(expectedStorage)
    })

    it('returns types info', function () {
      const expectedTypes = { 
        t_uint256: { label: 'uint256' },
        t_string: { label: 'string' },
        t_uint8: { label: 'uint8' },
        t_int8: { label: 'int8' },
        t_bool: { label: 'bool' },
        t_address: { label: 'address' } 
      }

      this.assertTypes(expectedTypes)
    })
  })

  describe('on constants', function () {
    beforeEach(function () {
      this.getStorageLayout('StorageMockWithConstants')
    })

    it('does not identify constants as storage variables', function () {
      this.assertStorage([])
    })
  })

  describe('on arrays', function () {
    beforeEach(function () {
      this.getStorageLayout('StorageMockWithArrays')
    })

    it('returns storage', function () {
      const expectedStorage = [ 
        { label: 'my_public_uint256_dynarray', type: 't_array:dyn<t_uint256>' },
        { label: 'my_internal_string_dynarray', type: 't_array:dyn<t_string>' },
        { label: 'my_private_address_dynarray', type: 't_array:dyn<t_address>' },
        { label: 'my_public_int8_staticarray', type: 't_array:10<t_int8>' },
        { label: 'my_internal_bool_staticarray', type: 't_array:20<t_bool>' },
        { label: 'my_private_uint_staticarray', type: 't_array:30<t_uint256>' }
      ]

      this.assertStorage(expectedStorage)
    })

    it('returns types info', function () {
      const expectedTypes = { 
        't_array:dyn<t_uint256>': { label: 'uint256[]' },
        't_array:dyn<t_string>': { label: 'string[]' },
        't_array:dyn<t_address>': { label: 'address[]' },
        't_array:10<t_int8>': { label: 'int8[10]' },
        't_array:20<t_bool>': { label: 'bool[20]' },
        't_array:30<t_uint256>': { label: 'uint256[30]' }
      }
      this.assertTypes(expectedTypes)
    })
  })

  describe('on mappings', function () {
    beforeEach(function () {
      this.getStorageLayout('StorageMockWithMappings')
    })

    it('returns storage', function () {
      const expectedStorage = [ 
        { label: 'my_mapping', type: 't_mapping<t_string>' },
        { label: 'my_nested_mapping', type: 't_mapping<t_address>' },
        { label: 'my_mapping_with_arrays', type: 't_mapping<t_array:dyn<t_bool>>' }
      ]
      
      this.assertStorage(expectedStorage)
    })

    it('returns types info', function () {
      const expectedTypes = { 
        't_mapping<t_string>': { valueType: 't_string', kind: 'mapping', label: 'mapping(key => string)' },
        't_mapping<t_address>': { valueType: 't_address', kind: 'mapping', label: 'mapping(key => address)' },
        't_mapping<t_array:dyn<t_bool>>': { valueType: 't_array:dyn<t_bool>', kind: 'mapping', label: 'mapping(key => bool[])' }
      }

      this.assertTypes(expectedTypes)
    })
  })

  describe('on contracts', function () {
    beforeEach(function () {
      this.getStorageLayout('StorageMockWithContracts')
    })

    it('replaces contract identifier with address', function () {
      this.storage[0].type.should.eq('t_address')
    })

    it('returns storage', function () {
      const expectedStorage = [ 
        { label: 'my_contract', type: 't_address' },
        { label: 'my_contract_dynarray', type: 't_array:dyn<t_address>' },
        { label: 'my_contract_staticarray', type: 't_array:10<t_address>' },
        { label: 'my_contract_mapping', type: 't_mapping<t_address>' },
        { label: 'my_contract_dynarray_mapping', type: 't_mapping<t_array:dyn<t_address>>' },
        { label: 'my_contract_staticarray_mapping', type: 't_mapping<t_array:10<t_address>>' }
      ]
      
      this.assertStorage(expectedStorage)
    })

    it('returns types info', function () {
      const expectedTypes = { 
        't_address': { kind: 'elementary', label: 'address' },
        't_array:dyn<t_address>': { valueType: 't_address', length: 'dyn', kind: 'array', label: 'address[]' },
        't_array:10<t_address>':  { valueType: 't_address', length: '10', kind: 'array', label: 'address[10]' },
        't_mapping<t_address>': { valueType: 't_address', kind: 'mapping', label: 'mapping(key => address)' },
        't_mapping<t_array:dyn<t_address>>': { valueType: 't_array:dyn<t_address>', kind: 'mapping', label: 'mapping(key => address[])' },
        't_mapping<t_array:10<t_address>>': { valueType: 't_array:10<t_address>', kind: 'mapping', label: 'mapping(key => address[10])' }
      }

      this.assertTypes(expectedTypes)
    })
  })

  describe('on enums', function () {
    beforeEach(function () {
      this.getStorageLayout('StorageMockWithEnums')
    })

    it('uses enum canonical name as type id', function () {
      this.storage[0].type.should.eq('t_enum<StorageMockWithEnums.MyEnum>')
    })

    it('tracks enum members in type definition', function () {
      const members = this.types['t_enum<StorageMockWithEnums.MyEnum>'].members
      members.should.deep.eq(['State1', 'State2'])
    })

    it('returns storage', function () {
      const expectedStorage = [ 
        { label: 'my_enum', type: 't_enum<StorageMockWithEnums.MyEnum>' },
        { label: 'my_enum_dynarray', type: 't_array:dyn<t_enum<StorageMockWithEnums.MyEnum>>' },
        { label: 'my_enum_staticarray', type: 't_array:10<t_enum<StorageMockWithEnums.MyEnum>>' },
        { label: 'my_enum_mapping', type: 't_mapping<t_enum<StorageMockWithEnums.MyEnum>>' },
      ]
      
      this.assertStorage(expectedStorage)
    })

    it('returns types info', function () {
      const expectedTypes = { 
        't_enum<StorageMockWithEnums.MyEnum>': { kind: 'enum', label: 'StorageMockWithEnums.MyEnum' },
        't_array:dyn<t_enum<StorageMockWithEnums.MyEnum>>': { valueType: 't_enum<StorageMockWithEnums.MyEnum>', length: 'dyn', kind: 'array', label: 'StorageMockWithEnums.MyEnum[]' },
        't_array:10<t_enum<StorageMockWithEnums.MyEnum>>': { valueType: 't_enum<StorageMockWithEnums.MyEnum>', length: '10', kind: 'array', label: 'StorageMockWithEnums.MyEnum[10]' },
        't_mapping<t_enum<StorageMockWithEnums.MyEnum>>': { valueType: 't_enum<StorageMockWithEnums.MyEnum>', label: 'mapping(key => StorageMockWithEnums.MyEnum)', kind: 'mapping' }
      }

      this.assertTypes(expectedTypes)
    })
  })

  describe('on structs', function () {
    beforeEach(function () {
      this.getStorageLayout('StorageMockWithStructs')
    })

    it('uses struct canonical name as type id', function () {
      this.storage[0].type.should.eq('t_struct<StorageMockWithStructs.MyStruct>')
    })

    it('tracks struct members in type definition', function () {
      const members = this.types['t_struct<StorageMockWithStructs.MyStruct>'].members
      members.should.have.lengthOf(3)
      members[0].should.include({ label: 'struct_uint256', type: 't_uint256' })
      members[1].should.include({ label: 'struct_string', type: 't_string' })
      members[2].should.include({ label: 'struct_address', type: 't_address' })
    })

    it('returns storage', function () {
      const expectedStorage = [ 
        { label: 'my_struct', type: 't_struct<StorageMockWithStructs.MyStruct>' },
        { label: 'my_struct_dynarray', type: 't_array:dyn<t_struct<StorageMockWithStructs.MyStruct>>' },
        { label: 'my_struct_staticarray', type: 't_array:10<t_struct<StorageMockWithStructs.MyStruct>>' },
        { label: 'my_struct_mapping', type: 't_mapping<t_struct<StorageMockWithStructs.MyStruct>>' },
      ]
      
      this.assertStorage(expectedStorage)
    })

    it('returns types info', function () {
      const expectedTypes = { 
        't_struct<StorageMockWithStructs.MyStruct>': { kind: 'struct', label: 'StorageMockWithStructs.MyStruct' },
        't_array:dyn<t_struct<StorageMockWithStructs.MyStruct>>': { valueType: 't_struct<StorageMockWithStructs.MyStruct>', length: 'dyn', kind: 'array', label: 'StorageMockWithStructs.MyStruct[]' },
        't_array:10<t_struct<StorageMockWithStructs.MyStruct>>': { valueType: 't_struct<StorageMockWithStructs.MyStruct>', length: '10', kind: 'array', label: 'StorageMockWithStructs.MyStruct[10]' },
        't_mapping<t_struct<StorageMockWithStructs.MyStruct>>': { valueType: 't_struct<StorageMockWithStructs.MyStruct>', label: 'mapping(key => StorageMockWithStructs.MyStruct)', kind: 'mapping' }
      }

      this.assertTypes(expectedTypes)
    })
  })

  describe('on complex structs', function () {
    beforeEach(function () {
      this.getStorageLayout('StorageMockWithComplexStructs')
    })

    it('tracks struct members in type definition', function () {
      const members = this.types['t_struct<StorageMockWithComplexStructs.MyStruct>'].members
      members.should.have.lengthOf(3)
      members[0].should.include({ label: 'uint256_dynarray', type: 't_array:dyn<t_uint256>' })
      members[1].should.include({ label: 'mapping_enums', type: 't_mapping<t_enum<StorageMockWithEnums.MyEnum>>' })
      members[2].should.include({ label: 'other_struct', type: 't_struct<StorageMockWithStructs.MyStruct>' })
    })

    it('returns storage', function () {
      const expectedStorage = [ 
        { label: 'my_struct', type: 't_struct<StorageMockWithComplexStructs.MyStruct>' },
        { label: 'my_other_struct', type: 't_struct<StorageMockWithStructs.MyStruct>' }
      ]
      
      this.assertStorage(expectedStorage)
    })
  })

  describe.skip('on recursive structs', function () {
    beforeEach(function () {
      this.getStorageLayout('StorageMockWithRecursiveStructs')
    })

    it('tracks struct members in type definition', function () {
      const members = this.types['t_struct<StorageMockWithRecursiveStructs.MyStruct>'].members
      members.should.have.lengthOf(1)
      members[0].should.include({ label: 'other_stucts', type: 't_array:dyn<t_struct<StorageMockWithRecursiveStructs.OtherStruct>>' })
    })

    it('returns storage', function () {
      const expectedStorage = [{ label: 'my_struct', type: 't_struct<StorageMockWithRecursiveStructs.MyStruct>' }]
      this.assertStorage(expectedStorage)
    })

    it('returns types info', function () {
      const expectedTypes = { 
        't_struct<StorageMockWithRecursiveStructs.MyStruct>': { kind: 'struct', label: 'StorageMockWithRecursiveStructs.MyStruct' },
        't_struct<StorageMockWithRecursiveStructs.OtherStruct>': { kind: 'struct', label: 'StorageMockWithRecursiveStructs.OtherStruct' }
      }

      this.assertTypes(expectedTypes)
    })
  })

})
