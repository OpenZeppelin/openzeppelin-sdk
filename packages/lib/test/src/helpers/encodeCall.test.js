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
        expect(() => encodeCall('myFunction', ['uint956'], [123])).to.throw(/Invalid/);
        expect(() => encodeCall('myFunction', ['bytes0'], [123])).to.throw(/Invalid/);
      });
    
      it('should fail with invalid non matching number of types and values', () => {
        expect(() => encodeCall('myFunction', ['uint', 'address'], [123])).to.throw(/Supplied number of types and values do not match./);
      });

      it('should fail with invalid type/value pairs', () => {
        expect(() => encodeCall('myFunction', ['uint'], ['hello'])).to.throw(/Invalid parameter/);
        expect(() => encodeCall('myFunction', ['uint'], ['-42'])).to.throw(/Invalid parameter/);
        expect(() => encodeCall('myFunction', ['int'], ['3.14'])).to.throw(/Invalid parameter/);
        expect(() => encodeCall('myFunction', ['int'], ['-3.14'])).to.throw(/Invalid parameter/);
        expect(() => encodeCall('myFunction', ['string'], [32])).to.throw(/argument must be of type/);
        expect(() => encodeCall('myFunction', ['address'], ['0x0fd60495d7057689fbe8b3'])).to.throw(/Invalid parameter/);
        expect(() => encodeCall('myFunction', ['bytes'], [32])).to.throw(/The first argument must be one of type/);
      });
    });
  });

  describe('parseValuePair function', () => {
    describe('when the specified type is a number (int, uint, etc)', () => {
      it('should throw on NaN', () => {
        expect(() => parseTypeValuePair('uint', 'schnitzel')).to.throw(/Invalid parameter/);
        expect(() => parseTypeValuePair('uint', new BN('hello'))).to.throw(/Invalid parameter/);
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
        expect(() => parseTypeValuePair('uint', -42)).to.throw(/Invalid parameter/);
        expect(() => parseTypeValuePair('uint', new BN(-42))).to.throw(/Invalid parameter/);
        expect(() => parseTypeValuePair('uint', '-42')).to.throw(/Invalid parameter/);
      });

      it('should throw on non integer numbers', () => {
        expect(() => parseTypeValuePair('uint', 3.14)).to.throw(/Invalid parameter/);
        expect(() => parseTypeValuePair('int', -3.14)).to.throw(/Invalid parameter/);
        expect(() => parseTypeValuePair('uint', new BN(3.14))).to.throw(/Invalid parameter/);
      });

      it('should understand scientific notation numbers expressed as strings', () => {
        expect(parseTypeValuePair('int', '20e70')).to.equal(new BN('2e+71').toString(10));
      });

      it('should throw when the specified numeric literal is not finite', () => {
        expect(() => parseTypeValuePair('uint', 2**2000)).to.throw(/Invalid parameter/);
      });
    });

    describe('when the specified type is a string', () => {
      it('should accept any string and return the same string', () => {
        expect(parseTypeValuePair('string', 'hello')).to.equal('hello');
        expect(parseTypeValuePair('string', '0x123')).to.equal('0x123');
        expect(parseTypeValuePair('string', '42')).to.equal('42');
        expect(parseTypeValuePair('string', '0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e')).to.equal('0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e');
      });
    });

    describe('when the specified type is bytes (includes bytes1, bytes2, etc)', () => {
      it('should accept byte arrays expressed in hexadecimal form', () => {
        expect(parseTypeValuePair('bytes', '0xabc')).to.equal('0xabc');
      });

      it('should throw when a byte array expressed in hexadecimal form is invalid', () => {
        expect(() => parseTypeValuePair('bytes', '0xabcqqq')).to.throw(/Invalid parameter/);
      });

      it('should interpret empty strings as valid empty bytes', () => {
        expect(parseTypeValuePair('bytes', '')).to.equal('');
      });
      
      it('should accept Buffer values', () => {
        expect(parseTypeValuePair('bytes', Buffer.from('hello', 'utf8'))).to.equal('hello');
        expect(parseTypeValuePair('bytes', Buffer.from('123abc', 'hex'))).to.equal('\u0012:�');
      });
    });

    describe('when the specified type is an address', () => {
      it('should accept valid addresses (and not confuse e chars with scientific notation)', () => {
        expect(parseTypeValuePair('address', '0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e')).to.equal('0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e');
      });

      it('should throw when an invalid address is passed', () => {
        expect(() => parseTypeValuePair('address', '0x39af68cF04Abb8f9d8191E1bD9ce18e')).to.throw(/Invalid parameter/);
        expect(() => parseTypeValuePair('address', '0x00000000000000000000000000000000000000000000000000000000f8a8fd6d')).to.throw(/Invalid parameter/);
      });

      it('should throw when an address with upper and lower case chars and an invalid checksum is passed', () => {
        expect(() => parseTypeValuePair('address', '0xCF5609B003b2776699eeA1233F7C82d5695CC9AA')).to.throw(/Invalid parameter/);
      });

      it('should not throw when an address with an invalid checksum is passed, if the address contains all upper or lower case strings', () => {
        expect(() => parseTypeValuePair('address', '0xCF5609B003B2776699EEA1233F7C82D5695CC9AA')).to.not.throw;
        expect(() => parseTypeValuePair('address', '0xcf5609b003b2776699eea1233f7c82d5695cc9aa')).to.not.throw;
      });

      it('should accept addresses passed as buffers', () => {
        expect(parseTypeValuePair('address', Buffer.from('0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e', 'utf8'))).to.equal('0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e');
      });
    });

    describe('when the specified type is an array', () => {
      it('should simply pass them along', () => {
        expect(parseTypeValuePair('uint256[]', '20,30')).to.equal('20,30');
        expect(parseTypeValuePair('uint256[]', [20, 30])).to.deep.equal([20,30]);
      });
      it('should parse uint array elements');
      it('should parse uint address elements');
      it('should parse uint bytes elements');
    });
  });
})
