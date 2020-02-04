require('../../setup');

import BN from 'bignumber.js';
import { zipWith } from 'lodash';
import encodeCall, { decodeCall } from '../../../src/helpers/encodeCall';

import { expect } from 'chai';

const FUNCTION_NAME = 'myFunction';

describe('encodeCall helper', () => {
  it('should throw with invalid types', () => {
    assertBadEncoding(['shnitzel'], [123], /invalid type/);
  });

  it('should fail with invalid type widths', () => {
    assertBadEncoding(['uint512'], [123], /invalid uint bit length/);
    assertBadEncoding(['bytes0'], [Buffer.from('0xab', 'hex')], /invalid bytes length/);
  });

  it('should fail with invalid non matching number of types and values', () => {
    assertBadEncoding(['uint', 'address'], [123], /types\/values length mismatch/);
  });

  it('should fail with invalid type/value pairs', () => {
    assertBadEncoding(['uint'], ['hello'], /invalid number value/);
    assertBadEncoding(['uint'], ['-42'], /invalid number value/);
    assertBadEncoding(['uint'], [-42], /invalid number value/);
    assertBadEncoding(['int'], ['3.14'], /invalid number value/);
    assertBadEncoding(['int'], ['-3.14'], /invalid number value/);
    assertBadEncoding(['string'], [32], /invalid string value/);
    assertBadEncoding(['address'], ['0x0fd60495d7057689fbe8b3'], /invalid address/);
    assertBadEncoding(['bytes'], [32], /invalid bytes value/);
  });

  describe('when the specified type is a number (int, uint, etc)', () => {
    it('should accept valid values', () => {
      assertGoodEncoding(['int', 'string'], [5, 'hello']);
      assertGoodEncoding(['int'], ['5']);
      assertGoodEncoding(['int'], [42]);
      assertGoodEncoding(['uint'], [0x2a]);
      assertGoodEncoding(['int'], [0b11]);
      assertGoodEncoding(['int'], [1e2]);
      assertGoodEncoding(['uint'], [Number.MAX_SAFE_INTEGER]);
      assertGoodEncoding(['uint'], [new BN(5).toString()]);
    });

    it('should throw on NaN', () => {
      assertBadEncoding(['uint'], ['schnitzel'], /invalid number value/);
      assertBadEncoding(['uint'], [new BN('hello')], /invalid number value/);
    });

    it('should throw on negative numbers when specified type is unsigned', () => {
      assertBadEncoding(['uint'], [-42], /invalid number value/);
      assertBadEncoding(['uint'], [new BN(-42)], /invalid number value/);
      assertBadEncoding(['uint'], ['-42'], /invalid number value/);
    });

    it('should throw on non integer numbers', () => {
      assertBadEncoding(['uint'], [0.14], /invalid number value/);
      assertBadEncoding(['int'], [-3.14], /invalid number value/);
      assertBadEncoding(['uint'], [new BN(3.14)], /invalid number value/);
    });

    it('should throw when the specified numeric literal is not finite', () => {
      assertBadEncoding(['int'], [{}], /invalid number value/);
    });
  });

  describe('when the specified type is a string', () => {
    it('should accept valid values', () => {
      assertGoodEncoding(['string'], ['hello']);
      assertGoodEncoding(['string'], ['0x123']);
      assertGoodEncoding(['string'], ['42']);
      assertGoodEncoding(['string'], ['0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e']);
    });

    it('should throw when the passed value is not a string nor a Buffer', () => {
      assertBadEncoding(['string'], [2], /invalid string value/);
      assertBadEncoding(['string'], [{}], /invalid string value/);
    });
  });

  describe('when the specified type is bytes (includes bytes1, bytes2, etc)', () => {
    it('should accept valid values', () => {
      assertGoodEncoding(['bytes'], ['0x2a']);
      assertGoodEncoding(['bytes'], ['0xabcd']);
      assertGoodEncoding(['bytes'], ['0xabcdef']);
      assertGoodEncoding(['bytes'], [Buffer.from('')]);
      assertGoodEncoding(['bytes'], [Buffer.from('hello')]);
    });

    it('should throw when a byte array expressed as a hexadecimal string is invalid', () => {
      assertBadEncoding(['bytes'], ['0xabcqqq'], /invalid bytes value/);
    });

    it('should throw when the passed value is not a string nor a Buffer', () => {
      assertBadEncoding(['bytes'], [2], /invalid bytes value/);
      assertBadEncoding(['bytes'], [{}], /invalid bytes value/);
    });
  });

  describe('when the specified type is an address', () => {
    it('should accept valid values', () => {
      assertGoodEncoding(['address'], ['0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e']);
    });

    it('should throw when an invalid address is passed', () => {
      assertBadEncoding(['address'], ['0x39af68cF04Abb8f9d8191E1bD9ce18e'], /invalid address/);
      assertBadEncoding(
        ['address'],
        ['0x00000000000000000000000000000000000000000000000000000000f8a8fd6d'],
        /invalid address/,
      );
    });

    it('should throw when an address with upper and lower case chars and an invalid checksum is passed', () => {
      assertBadEncoding(['address'], ['0xCF5609B003b2776699eeA1233F7C82d5695CC9AA'], /invalid address/);
    });

    it('should not throw when an address with an invalid checksum is passed, if the address contains all upper or lower case strings', () => {
      expect(() =>
        encodeCall(FUNCTION_NAME, ['address'], ['0xCF5609B003B2776699EEA1233F7C82D5695CC9AA']),
      ).to.not.throw();
      expect(() =>
        encodeCall(FUNCTION_NAME, ['address'], ['0xcf5609b003b2776699eea1233f7c82d5695cc9aa']),
      ).to.not.throw();
    });

    it('should throw when the passed value is not a string nor a Buffer', () => {
      assertBadEncoding(['address'], [2], /invalid address/);
      assertBadEncoding(['address'], [{}], /invalid address/);
    });
  });

  describe('when the specified type is a tuple', function() {
    it('identifies the individual types and treats them recursively', () => {
      assertGoodEncoding(['tuple(uint256,string)'], [[42, 'hello']]);
      assertGoodEncoding(['tuple(uint256,string)'], [['42', 'hello']]);
    });

    it('should throw when the passed tuple types do not match', () => {
      assertBadEncoding(['tuple(uint256,string)'], [['hello', 42]], null);
      assertBadEncoding(['tuple(uint256,string)'], [['42']], null);
    });

    it('supports nested tuples', function() {
      assertGoodEncoding(['tuple(uint256,string[])'], [[42, ['one', 'two', 'three']]]);
      assertGoodEncoding(['tuple(uint256,tuple(uint256,string))'], [[42, [42, 'hello']]]);
    });
  });

  describe('when the specified type is a boolean', () => {
    it('should understand boolean types', function() {
      assertGoodEncoding(['bool'], [true]);
      assertGoodEncoding(['bool'], [false]);
    });
  });

  describe('when the specified type is an array', () => {
    it('should accept valid values', () => {
      assertGoodEncoding(['uint256[]'], [[20, 30]]);
      assertGoodEncoding(
        ['address[]'],
        [['0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e', '0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e']],
      );
      assertGoodEncoding(['string[]'], [['hello', '']]);
      assertGoodEncoding(['bool[]'], [[true, false]]);
    });

    it('should throw when the values do not match the type', function() {
      assertBadEncoding(['address[]'], [['one', 'two']], /invalid address/);
      assertBadEncoding(['uint256[]'], [['20', '30', 'hello']], /invalid number value/);
      assertBadEncoding(['uint256[]'], [['20', '-30']], /invalid number value/);
    });

    it('should throw when array fixed size and number of elements do not match', () => {
      assertBadEncoding(['uint[2]'], [[1]], /too many arguments/);
      assertBadEncoding(['uint[2]'], [[1, 2, 3]], /missing argument/);
    });
  });
});

function assertGoodEncoding(types, values) {
  const encoded = encodeCall(FUNCTION_NAME, types, values).substring(10); // Remove signature hash.
  const decoded = decodeCall(types, `0x${encoded}`);
  if (values.length !== decoded.length)
    throw new Error('Invalid encoding/decoding: Mismatch in number of encoded and decoded values.');

  zipWith(values, decoded, (value, decodedValue) => {
    if (Buffer.isBuffer(value)) value = `0x${value.toString('hex')}`;
    if (value.toString() != decodedValue.toString())
      throw new Error(`Invalid encoding/decoding. Encoded: ${value}, Decoded: ${decodedValue}`);
  });
}

function assertBadEncoding(types, values, errorRegex) {
  expect(() => encodeCall(FUNCTION_NAME, types, values)).to.throw(errorRegex);
}
