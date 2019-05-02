'use strict'
require('../setup')

import utils from 'web3-utils';
import { ZWeb3 } from 'zos-lib';

import transfer from '../../src/scripts/transfer'

contract('transfer script', function(accounts) {
  const [_, sender, receiver] = accounts.map(utils.toChecksumAddress);

  describe('validations', function() {
    context('when no recipient address is specified', function() {
      it('throws an error', async function() {
        await transfer({ value: '10', unit: 'ether' }).should.be.rejectedWith('A recipient address must be specified');
      });
    });

    context('when no amount value is specified', function() {
      it('throws an error', async function() {
        await transfer({ to: receiver, unit: 'ether' }).should.be.rejectedWith('An amount to be transferred must be specified');
      });
    });

    context('when specifying an invalid unit', function() {
      it('throws an error', async function() {
        await transfer({ to: receiver, value: '10', unit: 'palla' }).should.be.rejectedWith(/Invalid unit palla/);
      });
    });
  });

  describe('transfer of funds', function() {
    context('when exceding the sender account balance', function() {
      it('throws an error', async function() {
        await transfer({ to: receiver, value: '1000', unit: 'ether' }).should.be.rejectedWith(/sender doesn't have enough funds to send tx/);
      });
    });

    context('when sending a valid amount of ether', function() {
      it('transfers funds', async function() {
        (await ZWeb3.getBalance(sender)).should.eq(100e18.toString());
        (await ZWeb3.getBalance(receiver)).should.eq(100e18.toString());

        await transfer({ from: sender, to: receiver, value: '10', unit: 'ether' });

        (await ZWeb3.getBalance(sender)).should.not.eq(100e18.toString());
        (await ZWeb3.getBalance(receiver)).should.eq(110e18.toString());
      });
    });
  });
});
