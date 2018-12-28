'use strict';

require('../../setup');

import encodeCall, { parseTypeValuePair } from '../../../src/helpers/encodeCall';
import BN from 'bignumber.js';

describe('encodeCall helper', function() {
  describe('encodeCall function', function() {
    it('should return a string with the 0x radix', function() {
      const enc = encodeCall('myFunction', ['uint256'], [123]);
      assert(enc.indexOf('0x') !== -1);
    });

    it('should be a valid hexadecimal', function() {
      const enc = encodeCall('myFunction', ['uint256'], [123]);
      expect(enc.match(/0[xX][0-9a-fA-F]+/)).to.not.be.empty;
    });

    it('should fail with invalid types', function() {
      expect(function() {
        encodeCall('myFunction', ['schnitzel'], [123]);
      }).to.throw(/Unsupported or invalid type/);
    });

    it('should fail with invalid type widths', function() {
      expect(function() {
        encodeCall('myFunction', ['uint956'], [123]);
      }).to.throw(/Invalid/);
      expect(function() {
        encodeCall('myFunction', ['bytes0'], [123]);
      }).to.throw(/Invalid/);
    });
    
    it('should fail with invalid non matching number of types and values', function() {
      expect(function() {
        encodeCall('myFunction', ['uint', 'address'], [123]);
      }).to.throw(/Supplied number of types and values do not match./);
    });

    it('should fail with invalid number type/value pairs', function() {
      expect(function() {
        encodeCall('myFunction', ['uint'], ['hello']);
      }).to.throw(/Invalid parameter/);
      expect(function() {
        encodeCall('myFunction', ['uint'], ['-42']);
      }).to.throw(/Invalid parameter/);
      expect(function() {
        encodeCall('myFunction', ['int'], ['3.14']);
      }).to.throw(/Invalid parameter/);
      expect(function() {
        encodeCall('myFunction', ['int'], ['-3.14']);
      }).to.throw(/Invalid parameter/);
    });

    it('should fail with invalid string type/value pairs', function() {
      expect(function() {
        encodeCall('myFunction', ['string'], [32]);
      }).to.throw(/argument must be of type/);
    });
    
    it('should fail with invalid bytes type/value pairs', function() {
      expect(function() {
        encodeCall('myFunction', ['bytes'], [32]);
      }).to.throw(/Invalid parameter/);
    });

    it('should fail with invalid address type/value pairs', function() {
      expect(function() {
        encodeCall('myFunction', ['address'], ['0x0fd60495d7057689fbe8b3']);
      }).to.throw(/Invalid parameter/);
    });

    it('should accept array parameters', function() {
      expect(function() {
        encodeCall('myFunction', ['uint256[]'], [[20, 30]]);
      }).to.not.throw();
    });

    it('should accept empty bytes', function() {
      expect(function() {
        encodeCall('myFunction', ['bytes'], ['']);
      }).to.not.throw();
    });

    it('should understand scientific notation numbers', function() {
      expect(function() {
        encodeCall('myFunction', ['uint256'], ['20e70']);
      }).to.not.throw();
    });

  });

  describe('parseValuePair function', function() {

    describe('on integers', function() {
      it('should return a small integer as a string', function() {
        expect(parseTypeValuePair('uint', 5)).to.equal('5');
      });

      it('should return a large integer as a string', function() {
        expect(parseTypeValuePair('uint', Number.MAX_SAFE_INTEGER)).to.equal(Number.MAX_SAFE_INTEGER.toString());
      });

      it('should understand scientific notation numbers', function() {
        expect(parseTypeValuePair('int', '20e70')).to.equal(new BN('2e+71').toString(10));
      });
      
    });

    describe('on floats', function() {
      it('should throw', function() {
        expect(function(){ 
          parseTypeValuePair('int', 3.14) 
        }).to.throw(/Invalid parameter/);
      });
    });

    describe('on bignumbers', function() {
      it('should return a small bignumber as a string', function() {
        expect(parseTypeValuePair('uint', new BN(5))).to.equal('5');
      });

      it('should return a large bignumber as a string', function() {
        expect(parseTypeValuePair('int', new BN(Number.MAX_SAFE_INTEGER))).to.equal(Number.MAX_SAFE_INTEGER.toString());
      });
    });

    describe('on arrays', function() {
      it('should not parse the array in any way', function() {
        expect(parseTypeValuePair('uint256[]', [20, 30])).to.deep.equal([20, 30]);
      });
    });

    describe('on numeric strings', function() {
      it('should identify numeric strings with exponents', function() {
        expect(parseTypeValuePair('uint', '1.5e9')).to.equal(new BN('1.5e9').toString(10));
      });
    });

    describe('on strings', function() {
      it('should just pass them along', function() {
        expect(parseTypeValuePair('string', 'hello')).to.equal('hello');
        expect(parseTypeValuePair('string', '42')).to.equal('42');
      });
    });
    
    describe('on addresse strings', function() {
      it('should handle addresses', function() {
        expect(parseTypeValuePair('address', '0xEB1020C2BfA170489fca37068F9c857CDCd5f19F')).to.equal('0xEB1020C2BfA170489fca37068F9c857CDCd5f19F');
      });
      
      it('should not mistake addresses with "e" characters as exponentials', function() {
        expect(parseTypeValuePair('address', '0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e')).to.equal('0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e');
      });
      
      it('should handle other hexadecimal strings', function() {
        expect(parseTypeValuePair('string', '0x39af68cF04Abb0e18e')).to.equal('0x39af68cF04Abb0e18e');
        expect(parseTypeValuePair('string', '0x2A')).to.equal('0x2A');
      });
    });
    
    describe('on hexadecimal numbers', function() {
      it('should handle other hexadecimal numbers as strings', function() {
        expect(parseTypeValuePair('int', '0x2a')).to.equal(new BN('0x2a').toString(10));
        expect(parseTypeValuePair('uint', '0x39af')).to.equal(new BN('0x39af').toString(10));
        expect(parseTypeValuePair('int', '0x39afabcAbc')).to.equal(new BN('0x39afabcabc').toString(10));
        expect(parseTypeValuePair('uint', '0x39af68cf04abb0e1')).to.equal(new BN('0x39af68cf04abb0e1').toString(10));
      });

      it('should handle other hexadecimal numbers as literals', function() {
        expect(parseTypeValuePair('int', 0x2a)).to.equal(new BN(0x2a).toString(10));
        expect(parseTypeValuePair('uint', 0x39af)).to.equal(new BN(0x39af).toString(10));
        expect(parseTypeValuePair('int', 0x39afabcAbc)).to.equal(new BN(0x39afabcabc).toString(10));
        expect(parseTypeValuePair('uint', 0x39af68cf04abb0e1)).to.equal(new BN(0x39af68cf04abb0e1).toString(10));
      });
    });
  });
})
