'use strict'
require('../setup')

import utils from 'web3-utils';

import transfer from '../../src/scripts/transfer'

contract('transfer script', function(accounts) {
  const [_, sender, receiver] = accounts.map(utils.toChecksumAddress);
  describe('validations', function() {
    context('when no recipient address is specified', function() {
      it('throws an error', async function() {
        await transfer({ value: 10, unit: 'ether' }).should.be.rejectedWith('A recipient address must be specified');
      });
    });

    context('when no amount value is specified', function() {
      it('throws an error', async function() {
        await transfer({ to: receiver, unit: 'ether' }).should.be.rejectedWith('An amount to be transferred must be specified');
      });
    });

    context('when specifying an invalid unit', function() {
      it('throws an error', async function() {
        await transfer({ to: receiver, value: 10, unit: 'palla' }).should.be.rejectedWith(/Invalid specified unit/);
      });
    });
  });

  describe('transfer of funds', function() {
    // TODO: test
    it('does something', function() {
    });
  });
});
