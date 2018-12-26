'use strict';

require('../../setup');

import encodeCall, { formatValue } from '../../../src/helpers/encodeCall';
import BN from 'bignumber.js';

describe('encodeCall helper', function() {

  describe('encodeCall function', function() {
    it('should return a string with the 0x radix', function() {
      const enc = encodeCall('myFunction', ['uint256', 'address'], [123, '0x123']);
      assert(enc.indexOf('0x') !== -1);
    });

    it('should be a valid hexadecimal', function() {
      const enc = encodeCall('myFunction', ['uint256', 'address'], [123, '0x123']);
      expect(enc.match(/0[xX][0-9a-fA-F]+/)).to.not.be.empty;
    });

    // TODO: extend encoding tests...
    
  });

  describe('formatValue function', function() {

    describe('on integers', function() {
      it('should return a small integer as a string', function() {
        expect(formatValue(5)).to.equal('5');
      });

      it('should return a large integer as a string', function() {
        expect(formatValue(Number.MAX_SAFE_INTEGER)).to.equal(Number.MAX_SAFE_INTEGER.toString());
      });
    });

    describe('on floats', function() {
      it('should throw', function() {
        expect(function(){ 
          formatValue(3.14) 
        }).to.throw(/Floating point numbers are not supported on parameter encoding./);
      });
    });

    describe('on bignumbers', function() {
      it('should return a small bignumber as a string', function() {
        expect(formatValue(new BN(5))).to.equal('5');
      });

      it('should return a large bignumber as a string', function() {
        expect(formatValue(new BN(Number.MAX_SAFE_INTEGER))).to.equal(Number.MAX_SAFE_INTEGER.toString());
      });
    });

    describe('on numeric strings', function() {
      it('should identify numeric strings with exponents', function() {
        expect(formatValue('1.5e9')).to.equal(new BN('1.5e9').toString(10));
      });
    });

    describe('on strings', function() {
      it('should just pass them along', function() {
        expect(formatValue('hello')).to.equal('hello');
        expect(formatValue('42')).to.equal('42');
      });
    });
    
    describe('on hexadecimal strings', function() {
      it('should handle addresses', function() {
        expect(formatValue('0xEB1020C2BfA170489fca37068F9c857CDCd5f19F')).to.equal('0xEB1020C2BfA170489fca37068F9c857CDCd5f19F');
      });
      
      it('should not mistake addresses with "e" characters as exponentials', function() {
        expect(formatValue('0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e')).to.equal('0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e');
      });
      
      it('should handle other hexadecimal strings', function() {
        expect(formatValue('0x39af68cF04Abb0e18e')).to.equal('0x39af68cF04Abb0e18e');
        expect(formatValue('0x2A')).to.equal('0x2A');
      });
    });
    
    describe('on hexadecimal numbers', function() {
      it('should handle addresses', function() {
        expect(formatValue(0xEB1020C2BfA170489fca37068F9c857CDCd5f19F)).to.equal(parseInt('0xEB1020C2BfA170489fca37068F9c857CDCd5f19F', 16).toString());
      });

      it('should not mistake addresses with "e" characters as exponentials', function() {
        expect(formatValue(0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e)).to.equal(parseInt('0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e', 16).toString());
      });

      it('should handle other hexadecimal numbers', function() {
        expect(formatValue(0x39af68cF04Abb0e18e)).to.equal(parseInt('0x39af68cF04Abb0e18e', 16).toString());
        expect(formatValue(0x2A)).to.equal(parseInt('0x2A', 16).toString());
      });
    });
  });
})
