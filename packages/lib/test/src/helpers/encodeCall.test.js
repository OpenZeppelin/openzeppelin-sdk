'use strict';

require('../../setup');

import encodeCall, { decodeCall } from '../../../src/helpers/encodeCall';
import BN from 'bignumber.js';
import _ from 'lodash';

const NAME = 'myFunction';

function goodEncoding(types, values) {
  expect(() => encodeCall(NAME, types, values)).to.not.throw();
  const encoded = encodeCall(NAME, types, values).substring(10); // Remove signature hash.
  const decoded = decodeCall(types, `0x${encoded}`);
  if(values.length !== decoded.length) throw new Error('Invalid ecoding/decoding: Mismatch in number of encoded and decoded values.');
  _.zipWith(values, decoded, (value, decodedValue) => {
    console.log(`encoded: ${value}, decoded: ${decodedValue}`);
    if(Buffer.isBuffer(value)) value = `0x${value.toString('hex')}`;
    if(value.toString() != decodedValue.toString()) throw new Error(`Invalid encoding/decoding. Encoded: ${value}, Decoded: ${decodedValue}`);
  });
}

function badEncoding(types, values, errorRegex) {
  expect(() => encodeCall(NAME, types, values)).to.throw(errorRegex);
}

describe.only('encodeCall helper', () => {
  it('should throw with invalid types', () => {
    badEncoding(['shnitzel'], [123], /invalid type/);
  });

  it('should fail with invalid type widths', () => {
    badEncoding(['uint512'], [123], /invalid uint bit length/);
    badEncoding(['bytes0'], [Buffer.from('0xab', 'hex')], /invalid bytes length/);
  });

  it('should fail with invalid non matching number of types and values', () => {
    badEncoding(['uint', 'address'], [123], /types\/values length mismatch/);
  });
  
  it('should fail with invalid type/value pairs', () => {
    badEncoding(['uint'], ['hello'], /invalid number value/);
    badEncoding(['uint'], ['-42'], /invalid number value/);
    badEncoding(['int'], ['3.14'], /invalid number value/);
    badEncoding(['int'], ['-3.14'], /invalid number value/);
    badEncoding(['string'], [32], /invalid string value/);
    badEncoding(['address'], ['0x0fd60495d7057689fbe8b3'], /invalid address/);
    badEncoding(['bytes'], [32], /invalid bytes value/);
  });
  
  describe('when the specified type is a number (int, uint, etc)', () => {
    it('should accept valid values', () => {
      goodEncoding(['int', 'string'], [5, 'hello']);
      goodEncoding(['int'], ['5']);
      goodEncoding(['int'], [42]);
      goodEncoding(['uint'], [0x2a]);
      goodEncoding(['int'], [0b11]);
      goodEncoding(['int'], [1e2]);
      goodEncoding(['uint'], [Number.MAX_SAFE_INTEGER]);
      goodEncoding(['uint'], [new BN(5).toString()]);
    });

    it('should throw on NaN', () => {
      badEncoding(['uint'], ['schnitzel'], /invalid number value/);
      badEncoding(['uint'], [new BN('hello')], /invalid number value/);
    });
    
    it('should throw on negative numbers when specified type is unsigned', () => {
      badEncoding(['uint'], [-42], /invalid number value/);
      badEncoding(['uint'], [new BN(-42)], /invalid number value/);
      badEncoding(['uint'], ['-42'], /invalid number value/);
    });

    it('should throw on non integer numbers', () => {
      badEncoding(['uint'], [.14], /invalid number value/);
      badEncoding(['int'], [-3.14], /invalid number value/);
      badEncoding(['uint'], [new BN(3.14)], /invalid number value/);
    });

    it('should throw when the specified numeric literal is not finite', () => {
      badEncoding(['int'], [{}], /invalid number value/);
    });
  });
  
  describe('when the specified type is a string', () => {
    it('should accept valid values', () => {
      goodEncoding(['string'], ['hello']);
      goodEncoding(['string'], ['0x123']);
      goodEncoding(['string'], ['42']);
      goodEncoding(['string'], ['0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e']);
    });

    it('should throw when the passed value is not a string nor a Buffer', () => {
      badEncoding(['string'], [2], /invalid string value/);
      badEncoding(['string'], [{}], /invalid string value/);
    });
  });
  
  describe('when the specified type is bytes (includes bytes1, bytes2, etc)', () => {
    it('should accept valid values', () => {
      goodEncoding(['bytes'], ['0x2a']);
      goodEncoding(['bytes'], ['0xabcd']);
      goodEncoding(['bytes'], ['0xabcdef']);
      goodEncoding(['bytes'], [Buffer.from('')]);
      goodEncoding(['bytes'], [Buffer.from('hello')]);
    });

    it('should throw when a byte array expressed as a hexadecimal string is invalid', () => {
      badEncoding(['bytes'], ['0xabcqqq'], /invalid bytes value/);
    });

    it('should throw when the passed value is not a string nor a Buffer', () => {
      badEncoding(['bytes'], [2], /invalid bytes value/);
      badEncoding(['bytes'], [{}], /invalid bytes value/);
    });
  });
  
  describe('when the specified type is an address', () => {
    it('should accept valid values', () => {
      goodEncoding(['address'], ['0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e']);
    });

    it('should throw when an invalid address is passed', () => {
      badEncoding(['address'], ['0x39af68cF04Abb8f9d8191E1bD9ce18e'], /invalid address/);
      badEncoding(['address'], ['0x00000000000000000000000000000000000000000000000000000000f8a8fd6d'], /invalid address/);
    });

    it('should throw when an address with upper and lower case chars and an invalid checksum is passed', () => {
      badEncoding(['address'], ['0xCF5609B003b2776699eeA1233F7C82d5695CC9AA'], /invalid address/);
    });

    it('should not throw when an address with an invalid checksum is passed, if the address contains all upper or lower case strings', () => {
      expect(() => encodeCall(NAME, ['address'], ['0xCF5609B003B2776699EEA1233F7C82D5695CC9AA'])).to.not.throw();
      expect(() => encodeCall(NAME, ['address'], ['0xcf5609b003b2776699eea1233f7c82d5695cc9aa'])).to.not.throw();
    });

    it('should throw when the passed value is not a string nor a Buffer', () => {
      badEncoding(['address'], [2], /invalid address/);
      badEncoding(['address'], [{}], /invalid address/);
    });
  });
  
  // TODO: ethers.js/abi-coder does not support ufixed and fixed types?
  // describe('when the specified type is a function', () => {});

  // TODO: ethers.js/abi-coder does not support function types?
  // describe('when the specified type is a function', () => {});
  
  describe('when the specified type is a tuple', function() {
    it('identifies the individual types and treats them recursively', () => {
      goodEncoding(['tuple(uint256,string)'], [[42, 'hello']]);
      goodEncoding(['tuple(uint256,string)'], [['42', 'hello']]);
    });
    
    it('should throw when the passed tuple types do not match', () => {
      badEncoding(['tuple(uint256,string)'], [['hello', 42]], null);
      badEncoding(['tuple(uint256,string)'], [['42']], null);
    });
    
    it('supports nested tuples', function() {
      goodEncoding(['tuple(uint256,string[])'], [[42, ['one', 'two', 'three']]]);
      goodEncoding(['tuple(uint256,tuple(uint256,string))'], [[42, [42, 'hello']]]);
      // 
    });
  });

  describe('when the specified type is a boolean', () => {
    it.only('should understand boolean types', function() {
      goodEncoding(['bool'], [true]);
      goodEncoding(['bool'], ['false']);
    });
  });

  describe('when the specified type is an array', () => {
    it('should accept valid values', () => {
      goodEncoding(['uint256[]'], [[20, 30]]);
      goodEncoding(['address[]'], [['0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e', '0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e']]);
      goodEncoding(['string[]'], [['hello', '']]);
      goodEncoding(['bool[]'], [[true, false]]);
    });

    it('should throw when the values do not match the type', function() {
      badEncoding(['address[]'], [['one', 'two']], /invalid address/);
      badEncoding(['uint256[]'], [['20', '30', 'hello']], /invalid number value/);
      badEncoding(['uint256[]'], [['20', '-30']], /invalid number value/);
    });

    it('should throw when array fixed size and number of elements do not match', () => {
      badEncoding(['uint[2]'], [[1]], /too many arguments/);
      badEncoding(['uint[2]'], [[1, 2, 3]], /missing argument/);
    });
  });
});
