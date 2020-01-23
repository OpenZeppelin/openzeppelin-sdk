'use strict';
require('../setup');

import BN from 'bignumber.js';

import { accounts } from '@openzeppelin/test-environment';

import { ZWeb3 } from '@openzeppelin/upgrades';

import transfer from '../../src/scripts/transfer';

describe('transfer script', function() {
  const [sender, receiver] = accounts;

  describe('validations', function() {
    context('when no recipient address is specified', function() {
      it('throws an error', async function() {
        await transfer({ value: '10', unit: 'ether' }).should.be.rejectedWith('A recipient address must be specified');
      });
    });

    context('when no amount value is specified', function() {
      it('throws an error', async function() {
        await transfer({ to: receiver, unit: 'ether' }).should.be.rejectedWith(
          'An amount to be transferred must be specified',
        );
      });
    });

    context('when specifying an invalid unit', function() {
      it('throws an error', async function() {
        await transfer({
          to: receiver,
          value: '10',
          unit: 'palla',
        }).should.be.rejectedWith(/Invalid unit palla/);
      });
    });
  });

  describe('transfer of funds', function() {
    context('when exceding the sender account balance', function() {
      it('throws an error', async function() {
        await transfer({
          to: receiver,
          value: '1000',
          unit: 'ether',
        }).should.be.rejectedWith(/sender doesn't have enough funds to send tx/);
      });
    });

    context('when sending a valid amount of ether', function() {
      it('transfers funds', async function() {
        const senderBalance = await ZWeb3.eth.getBalance(sender);
        const receiverBalance = await ZWeb3.eth.getBalance(receiver);

        await transfer({
          from: sender,
          to: receiver,
          value: '10',
          unit: 'ether',
        });

        (await ZWeb3.eth.getBalance(sender)).should.not.eq(new BN(senderBalance).toString());
        (await ZWeb3.eth.getBalance(receiver)).should.eq(new BN(receiverBalance).plus(10e18).toString());
      });
    });
  });
});
