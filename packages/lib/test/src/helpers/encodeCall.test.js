'use strict';

require('../../setup');

import encodeCall from '../../../src/helpers/encodeCall';
import BN from 'bignumber.js';

const NAME = 'myFunction';

describe('encodeCall helper', () => {
  it('should throw with invalid types', () => {
    expect(() => encodeCall(NAME, ['schnitzel'], [123])).to.throw(/invalid type/);
  });

  it('should fail with invalid type widths', () => {
    expect(() => encodeCall(NAME, ['uint512'], [123])).to.throw(/invalid uint bit length/);
    expect(() => encodeCall(NAME, ['bytes0'], [Buffer.from('0xab', 'hex')])).to.throw(/invalid bytes length/);
  });

  it('should fail with invalid non matching number of types and values', () => {
    expect(() => encodeCall(NAME, ['uint', 'address'], [123])).to.throw(/types\/values length mismatch/);
  });
  
  it('should fail with invalid type/value pairs', () => {
    expect(() => encodeCall(NAME, ['uint'], ['hello'])).to.throw(/invalid number value/);
    expect(() => encodeCall(NAME, ['uint'], ['-42'])).to.throw(/invalid number value/);
    expect(() => encodeCall(NAME, ['int'], ['3.14'])).to.throw(/invalid number value/);
    expect(() => encodeCall(NAME, ['int'], ['-3.14'])).to.throw(/invalid number value/);
    expect(() => encodeCall(NAME, ['string'], [32])).to.throw(/invalid string value/);
    expect(() => encodeCall(NAME, ['address'], ['0x0fd60495d7057689fbe8b3'])).to.throw(/invalid address/);
    expect(() => encodeCall(NAME, ['bytes'], [32])).to.throw(/invalid bytes value/);
  });
  
  describe('when the specified type is a number (int, uint, etc)', () => {
    it('should accept valid values', () => {
      expect(() => encodeCall(NAME, ['int'], [5])).to.not.throw();
      expect(() => encodeCall(NAME, ['int'], [42])).to.not.throw();
      expect(() => encodeCall(NAME, ['uint'], [0x2a])).to.not.throw();
      expect(() => encodeCall(NAME, ['int'], [0b11])).to.not.throw();
      expect(() => encodeCall(NAME, ['int'], [1e2])).to.not.throw();
      expect(() => encodeCall(NAME, ['uint'], [Number.MAX_SAFE_INTEGER])).to.not.throw();
      expect(() => encodeCall(NAME, ['uint'], [new BN(5).toString()])).to.not.throw();
    });

    it('should throw on NaN', () => {
      expect(() => encodeCall(NAME, ['uint'], ['schnitzel'])).to.throw(/invalid number value/);
      expect(() => encodeCall(NAME, ['uint'], [new BN('hello')])).to.throw(/invalid number value/);
    });
    
    it('should throw on negative numbers when specified type is unsigned', () => {
      expect(() => encodeCall(NAME, ['uint'], [-42])).to.throw(/invalid number value/);
      expect(() => encodeCall(NAME, ['uint'], [new BN(-42)])).to.throw(/invalid number value/);
      expect(() => encodeCall(NAME, ['uint'], ['-42'])).to.throw(/invalid number value/);
    });

    it('should throw on non integer numbers', () => {
      expect(() => encodeCall(NAME, ['uint'], [.14])).to.throw(/invalid number value/);
      expect(() => encodeCall(NAME, ['int'], [-3.14])).to.throw(/invalid number value/);
      expect(() => encodeCall(NAME, ['uint'], [new BN(3.14)])).to.throw(/invalid number value/);
    });

    it('should throw when the specified numeric literal is not finite', () => {
      expect(() => encodeCall(NAME, ['int'], [{}])).to.throw(/invalid number value/);
    });
  });
  
  describe('when the specified type is a string', () => {
    it('should accept valid values', () => {
      expect(() => encodeCall(NAME, ['string'], ['hello'])).to.not.throw();
      expect(() => encodeCall(NAME, ['string'], ['0x123'])).to.not.throw();
      expect(() => encodeCall(NAME, ['string'], ['42'])).to.not.throw();
      expect(() => encodeCall(NAME, ['string'], ['0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e'])).to.not.throw();
    });

    it('should throw when the passed value is not a string nor a Buffer', () => {
      expect(() => encodeCall(NAME, ['string'], [2])).to.throw(/invalid string value/);
      expect(() => encodeCall(NAME, ['string'], [{}])).to.throw(/invalid string value/);
    });
  });
  
  describe('when the specified type is bytes (includes bytes1, bytes2, etc)', () => {
    it('should accept valid values', () => {
      expect(() => encodeCall(NAME, ['bytes'], ['0x2a'])).to.not.throw();
      expect(() => encodeCall(NAME, ['bytes'], ['0xabc'])).to.not.throw();
      expect(() => encodeCall(NAME, ['bytes'], ['0xabcdef'])).to.not.throw();
      expect(() => encodeCall(NAME, ['bytes'], [Buffer.from('')])).to.not.throw();
      expect(() => encodeCall(NAME, ['bytes'], [Buffer.from('hello')])).to.not.throw();
    });

    it('should throw when a byte array expressed as a hexadecimal string is invalid', () => {
      expect(() => encodeCall(NAME, ['bytes'], ['0xabcqqq'])).to.throw(/invalid bytes value/);
    });

    it('should throw when the passed value is not a string nor a Buffer', () => {
      expect(() => encodeCall(NAME, ['bytes'], [2])).to.throw(/invalid bytes value/);
      expect(() => encodeCall(NAME, ['bytes'], [{}])).to.throw(/invalid bytes value/);
    });
  });
  
  describe('when the specified type is an address', () => {
    it('should accept valid values', () => {
      expect(() => encodeCall(NAME, ['address'], ['0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e'])).to.not.throw();
    });

    it('should throw when an invalid address is passed', () => {
      expect(() => encodeCall(NAME, ['address'], ['0x39af68cF04Abb8f9d8191E1bD9ce18e'])).to.throw(/invalid address/);
      expect(() => encodeCall(NAME, ['address'], ['0x00000000000000000000000000000000000000000000000000000000f8a8fd6d'])).to.throw(/invalid address/);
    });

    it('should throw when an address with upper and lower case chars and an invalid checksum is passed', () => {
      expect(() => encodeCall(NAME, ['address'], ['0xCF5609B003b2776699eeA1233F7C82d5695CC9AA'])).to.throw(/invalid address/);
    });

    it('should not throw when an address with an invalid checksum is passed, if the address contains all upper or lower case strings', () => {
      expect(() => encodeCall(NAME, ['address'], ['0xCF5609B003B2776699EEA1233F7C82D5695CC9AA'])).to.not.throw();
      expect(() => encodeCall(NAME, ['address'], ['0xcf5609b003b2776699eea1233f7c82d5695cc9aa'])).to.not.throw();
    });

    it('should throw when the passed value is not a string nor a Buffer', () => {
      expect(() => encodeCall(NAME, ['address'], [2])).to.throw(/invalid address/);
      expect(() => encodeCall(NAME, ['address'], [{}])).to.throw(/invalid address/);
    });
  });
  
  // TODO: ethers.js/abi-coder does not support ufixed and fixed types?
  // describe('when the specified type is a function', () => {});

  // TODO: ethers.js/abi-coder does not support function types?
  // describe('when the specified type is a function', () => {});
  
  describe('when the specified type is a tuple', function() {
    it('identifies the individual types and treats them recursively', () => {
      expect(() => encodeCall(NAME, ['tuple(uint256,string)'], [[42, 'hello']])).to.not.throw();
    });
    
    it('should throw when the passed tuple types do not match', () => {
      expect(() => encodeCall(['tuple(uint256,string)'], [['hello', 42]])).to.throw();
      expect(() => encodeCall(['tuple(uint256,string)'], [['42']])).to.throw();
    });
    
    it('supports nested tuples', function() {
      expect(() => encodeCall(NAME, ['tuple(uint256,string[])'], [[42, ['one', 'two', 'three']]])).to.not.throw();
      expect(() => encodeCall(NAME, ['tuple(uint256,tuple(uint256,string))'], [[42, [42, 'hello']]])).to.not.throw();
      // 
    });
  });

  // TODO: ethers.js/abi-coder does not perform any validation on booleans, do we want to do it ourselves?
  // describe('when the specified type is a boolean', () => {});

  describe('when the specified type is an array', () => {
    it('should accept valid values', () => {
      expect(() => encodeCall(NAME, ['uint256[]'], [[20, 30]])).to.not.throw();
      expect(() => encodeCall(NAME, ['address[]'], [['0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e', '0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e']])).to.not.throw();
      expect(() => encodeCall(NAME, ['string[]'], [['hello', '']])).to.not.throw();
      expect(() => encodeCall(NAME, ['bool[]'], [[true, false]])).to.not.throw();
    });

    it('should throw when the values do not match the type', function() {
      expect(() => encodeCall(NAME, ['address[]'], [['one', 'two']])).to.throw(/invalid address/);
      expect(() => encodeCall(NAME, ['uint256[]'], [['20', '30', 'hello']])).to.throw(/invalid number value/);
      expect(() => encodeCall(NAME, ['uint256[]'], [['20', '-30']])).to.throw(/invalid number value/);
    });

    it('should throw when array fixed size and number of elements do not match', () => {
      expect(() => encodeCall(NAME, ['uint[2]'], [[1]])).to.throw(/too many arguments/);
      expect(() => encodeCall(NAME, ['uint[2]'], [[1, 2, 3]])).to.throw(/missing argument/);
    });
  });
});
