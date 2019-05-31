'use strict';
require('../setup');

import {
  isValidUnit,
  prettifyTokenAmount,
  toWei,
  fromWei,
} from '../../src/utils/units';

describe('units', function() {
  describe('functions', function() {
    describe('#prettifyTokenAmount', function() {
      context('when specifying decimals and symbol', function() {
        it('returns value and symbol', function() {
          prettifyTokenAmount((15e10).toString(), '10', 'TKN').should.eq(
            '15 TKN',
          );
        });
      });

      context('when not specifying decimals and symbol', function() {
        it('returns the raw amount value', function() {
          prettifyTokenAmount((15e10).toString()).should.eq((15e10).toString());
        });
      });
    });

    describe('#isValidUnit', function() {
      context('when providing an invalid unit', function() {
        it('returns false', function() {
          isValidUnit('foo').should.be.false;
          isValidUnit('foobar').should.be.false;
        });
      });

      context('when providing a valid unit', function() {
        it('returns true', function() {
          isValidUnit('wei').should.be.true;
          isValidUnit('gwei').should.be.true;
          isValidUnit('ether').should.be.true;
          isValidUnit('tether').should.be.true;
        });
      });
    });

    describe('#toWei', function() {
      context('when specifying ether as convertion unit', function() {
        it('transforms ethers to wei', function() {
          toWei('1', 'ether').should.eq((1e18).toString());
        });
      });

      context('when specifying gwei as convertion unit', function() {
        it('transforms gwei to wei', function() {
          toWei('1', 'gwei').should.eq((1e9).toString());
        });
      });
    });

    describe('#fromWei', function() {
      context('when specifying wei to convert to gwei', function() {
        it('transforms wei to gwei', function() {
          fromWei((1e18).toString(), 'gwei').should.eq((1e9).toString());
        });
      });

      context('when specifying gwei as convertion unit', function() {
        it('transforms wei to ether', function() {
          fromWei((1e18).toString(), 'ether').should.eq('1');
        });
      });
    });
  });
});
