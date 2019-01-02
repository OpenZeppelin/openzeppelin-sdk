'use strict';

require('../../setup');

import encodeCall, { parseTypeValuePair } from '../../../src/helpers/encodeCall';
import BN from 'bignumber.js';

describe('encodeCall helper', () => {
  describe('encodeCall function', () => {
    describe('regarding output', function() {
      it('should return a string with the 0x radix', () => {
        assert(encodeCall('myFunction', ['uint256'], [123]).startsWith('0x'));
      });

      it('should be a valid hexadecimal', () => {
        expect(encodeCall('myFunction', ['uint256'], [123]).match(/0[xX][0-9a-fA-F]+/)).to.not.be.empty;
      });

      // TODO: We're relying on ethereumjs-abi's tests here. We might do a bit of verification on the actual output.
    });

    describe('regarding input', function() {
      it('should throw with invalid types', () => {
        expect(() => encodeCall('myFunction', ['schnitzel'], [123])).to.throw(/Unsupported or invalid type/);
      });

      it('should fail with invalid type widths', () => {
        expect(() => encodeCall('myFunction', ['uint512'], [123])).to.throw(/Invalid/);
        expect(() => encodeCall('myFunction', ['bytes0'], [Buffer.from('0xab', 'hex')])).to.throw(/Invalid/);
      });
    
      it('should fail with invalid non matching number of types and values', () => {
        expect(() => encodeCall('myFunction', ['uint', 'address'], [123])).to.throw(/Supplied number of types and values do not match./);
      });

      it('should fail with invalid type/value pairs', () => {
        expect(() => encodeCall('myFunction', ['uint'], ['hello'])).to.throw(/Encoding error/);
        expect(() => encodeCall('myFunction', ['uint'], ['-42'])).to.throw(/Encoding error/);
        expect(() => encodeCall('myFunction', ['int'], ['3.14'])).to.throw(/Encoding error/);
        expect(() => encodeCall('myFunction', ['int'], ['-3.14'])).to.throw(/Encoding error/);
        expect(() => encodeCall('myFunction', ['string'], [32])).to.throw();
        expect(() => encodeCall('myFunction', ['address'], ['0x0fd60495d7057689fbe8b3'])).to.throw(/Encoding error/);
        expect(() => encodeCall('myFunction', ['bytes'], [32])).to.throw(/Encoding error/);
      });
    });
  });

  describe('parseValuePair function', () => {

    it('should throw when the specified type is not recognized', () => {
      expect(() => parseTypeValuePair('schnitzel', '42')).to.throw(/Unsupported or invalid type/);
    });

    describe('when the specified type is a number (int, uint, etc)', () => {
      it('should throw on NaN', () => {
        expect(() => parseTypeValuePair('uint', 'schnitzel')).to.throw(/Encoding error/);
        expect(() => parseTypeValuePair('uint', new BN('hello'))).to.throw(/Encoding error/);
      });
      
      it('should understand numeric literals and return them as strings', () => {
        expect(parseTypeValuePair('int', 5)).to.equal('5');
        expect(parseTypeValuePair('int', 42)).to.equal('42');
        expect(parseTypeValuePair('uint', 0x2a)).to.equal('42');
        expect(parseTypeValuePair('int', 0b11)).to.equal('3');
        expect(parseTypeValuePair('int', 1e2)).to.equal('100');
        expect(parseTypeValuePair('uint', Number.MAX_SAFE_INTEGER)).to.equal(Number.MAX_SAFE_INTEGER.toString());
      });

      it('should understand big numbers', () => {
        expect(parseTypeValuePair('int', new BN(5))).to.equal('5');
        expect(parseTypeValuePair('int', new BN('20e71'))).to.equal(new BN('2e+72').toString(10));
        expect(parseTypeValuePair('int', new BN(Number.MAX_SAFE_INTEGER))).to.equal(Number.MAX_SAFE_INTEGER.toString());
      });

      it('should throw on negative numbers when specified type is unsigned', () => {
        expect(() => parseTypeValuePair('uint', -42)).to.throw(/Encoding error/);
        expect(() => parseTypeValuePair('uint', new BN(-42))).to.throw(/Encoding error/);
        expect(() => parseTypeValuePair('uint', '-42')).to.throw(/Encoding error/);
      });

      it('should throw on non integer numbers', () => {
        expect(() => parseTypeValuePair('uint', 3.14)).to.throw(/Encoding error/);
        expect(() => parseTypeValuePair('int', -3.14)).to.throw(/Encoding error/);
        expect(() => parseTypeValuePair('uint', new BN(3.14))).to.throw(/Encoding error/);
      });

      it('should understand scientific notation numbers expressed as strings', () => {
        expect(parseTypeValuePair('int', '20e70')).to.equal(new BN('2e+71').toString(10));
      });

      it('should throw when the specified numeric literal is not finite', () => {
        expect(() => parseTypeValuePair('uint', 2**2000)).to.throw(/Encoding error/);
      });

      it('should throw when the passed value is not a string, not a number nor a big number', () => {
        expect(() => parseTypeValuePair('int', {})).to.throw(/Encoding error/);
      });
    });

    describe('when the specified type is a string', () => {
      it('should accept any string and return the same string', () => {
        expect(parseTypeValuePair('string', 'hello')).to.equal('hello');
        expect(parseTypeValuePair('string', '0x123')).to.equal('0x123');
        expect(parseTypeValuePair('string', '42')).to.equal('42');
        expect(parseTypeValuePair('string', '0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e')).to.equal('0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e');
      });

      it('should throw when the passed value is not a string nor a Buffer', () => {
        expect(() => parseTypeValuePair('string', 42)).to.throw(/Encoding error/);
        expect(() => parseTypeValuePair('string', {})).to.throw(/Encoding error/);
      });
    });

    describe('when the specified type is bytes (includes bytes1, bytes2, etc)', () => {
      it('should accept bytes expressed as hexadecimal strings', () => {
        expect(parseTypeValuePair('bytes', '0x2a')).to.deep.equal(Buffer.from('2a', 'hex'));
        expect(parseTypeValuePair('bytes', '0xabc')).to.deep.equal(Buffer.from('abc', 'hex'));
        expect(parseTypeValuePair('bytes', '0xabcdef')).to.deep.equal(Buffer.from('abcdef', 'hex'));
      });

      it('should throw when a byte array expressed as a hexadecimal string is invalid', () => {
        expect(() => parseTypeValuePair('bytes', '0xabcqqq')).to.throw(/Encoding error/);
      });

      it('should throw when the passed value is not a string nor a Buffer', () => {
        expect(() => parseTypeValuePair('bytes', 42)).to.throw(/Encoding error/);
        expect(() => parseTypeValuePair('bytes', {})).to.throw(/Encoding error/);
      });

      it('should accept Buffer objects', function() {
        expect(parseTypeValuePair('bytes', Buffer.from('heya'))).to.deep.equal(Buffer.from('heya'));
        expect(parseTypeValuePair('bytes', Buffer.from('abcdef', 'hex'))).to.deep.equal(Buffer.from('abcdef', 'hex'));
      });

      it('should interpret empty strings as valid empty bytes', () => {
        expect(parseTypeValuePair('bytes', '')).to.deep.equal(Buffer.from(''));
      });
    });

    describe('when the specified type is an address', () => {
      it('should accept valid addresses (and not confuse e chars with scientific notation)', () => {
        expect(parseTypeValuePair('address', '0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e')).to.equal('0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e');
      });

      it('should throw when an invalid address is passed', () => {
        expect(() => parseTypeValuePair('address', '0x39af68cF04Abb8f9d8191E1bD9ce18e')).to.throw(/Encoding error/);
        expect(() => parseTypeValuePair('address', '0x00000000000000000000000000000000000000000000000000000000f8a8fd6d')).to.throw(/Encoding error/);
      });

      it('should throw when an address with upper and lower case chars and an invalid checksum is passed', () => {
        expect(() => parseTypeValuePair('address', '0xCF5609B003b2776699eeA1233F7C82d5695CC9AA')).to.throw(/Encoding error/);
      });

      it('should not throw when an address with an invalid checksum is passed, if the address contains all upper or lower case strings', () => {
        expect(() => parseTypeValuePair('address', '0xCF5609B003B2776699EEA1233F7C82D5695CC9AA')).to.not.throw();
        expect(() => parseTypeValuePair('address', '0xcf5609b003b2776699eea1233f7c82d5695cc9aa')).to.not.throw();
      });

      it('should accept addresses passed as buffers', () => {
        expect(parseTypeValuePair('address', Buffer.from('0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e', 'utf8'))).to.equal('0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e');
      });

      it('should throw when the passed value is not a string nor a Buffer', () => {
        expect(() => parseTypeValuePair('address', 42)).to.throw(/Encoding error/);
        expect(() => parseTypeValuePair('address', {})).to.throw(/Encoding error/);
      });
    });

    describe('when the specified type is a fixed non integer number', () => {
      it('should accept non integers', () => {
        expect(parseTypeValuePair('ufixed', 3.14)).to.equal('3.14');
        expect(parseTypeValuePair('fixed', -3.14)).to.equal('-3.14');
      });
    });

    describe('when the specified type is boolean', () => {
      it('should accept boolean values', () => {
        expect(parseTypeValuePair('bool', false)).to.equal(false);
        expect(parseTypeValuePair('bool', true)).to.equal(true);
        expect(parseTypeValuePair('bool', 'false')).to.equal(false);
        expect(parseTypeValuePair('bool', 'true')).to.equal(true);
      });

      it('should reject invalid boolean values', () => {
        expect(() => parseTypeValuePair('bool', 'falsy')).to.throw();
      });

      it('should throw when the passed value is not a string nor a boolean', () => {
        expect(() => parseTypeValuePair('bool', 42)).to.throw(/Encoding error/);
        expect(() => parseTypeValuePair('bool', {})).to.throw(/Encoding error/);
      });
    });

    describe('when the specified type is an array', () => {
      it('should handle arrays', () => {
        expect(parseTypeValuePair('uint256[]', '20,30')).to.deep.equal(['20', '30']);
        expect(parseTypeValuePair('uint256[]', [20, 30])).to.deep.equal(['20', '30']);
        expect(parseTypeValuePair('address[]', ['0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1', '0xffcf8fdee72ac11b5c542428b35eef5769c409f0'])).to.deep.equal(['0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1', '0xffcf8fdee72ac11b5c542428b35eef5769c409f0']);
        expect(parseTypeValuePair('string[]', ['one', 'two'])).to.deep.equal(['one', 'two']);
        expect(parseTypeValuePair('bool[]', ['true', 'false'])).to.deep.equal([true, false]);
        expect(parseTypeValuePair('bool[]', [true, false])).to.deep.equal([true, false]);
      });

      it('should handle empty arrays', () => {
        expect(parseTypeValuePair('uint256[]', [])).to.deep.equal([]);
      });

      it('should throw when the values do not match the type', function() {
        expect(() => parseTypeValuePair('address[]', 'one,two')).to.throw(/Encoding error/);
        expect(() => parseTypeValuePair('uint256[]', '20,30,hello')).to.throw(/Encoding error/);
        expect(() => parseTypeValuePair('uint256[]', '20,-30')).to.throw(/Encoding error/);
      });

      it('should handle fixed sized arrays', () => {
        expect(parseTypeValuePair('uint256[1]', [1])).to.deep.equal(['1']);
        expect(parseTypeValuePair('uint256[2]', [1, 2])).to.deep.equal(['1', '2']);
        expect(parseTypeValuePair('uint256[3]', [1, 2, 3])).to.deep.equal(['1', '2', '3']);
      });

      it('should throw when array fixed size and number of elements do not match', () => {
        expect(() => parseTypeValuePair('uint[2]', [1])).to.throw(/Invalid array length/);
        expect(() => parseTypeValuePair('uint[2]', [1, 2, 3])).to.throw(/Invalid array length/);
      });
    });
  });
})
