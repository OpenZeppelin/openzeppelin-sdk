'use strict'
require('../setup')

import { assertRevert } from '@openzeppelin/upgrades'
import shouldBehaveLikeDonations from './Donations.behavior.js'

export default function(owner, donor, wallet, tokenName, tokenSymbol) {
  shouldBehaveLikeDonations(owner, donor, wallet);

  describe('token', function() {
    it('is mintable by the contract', async function() {
      (await this.token.methods.isMinter(this.donations.address).call()).should.equal(true);
    });

    it('cannot be set a second time', async function() {
      await assertRevert(
        this.donations.methods.setToken(this.token.address).send({from: owner})
      );
    });

    it('is the token set in the donations contract', async function() {
      (await this.donations.methods.token().call()).should.be.eq(this.token.address);
    });

  });

  describe('donate', function() {

    describe('when receiving a donation that is greater than zero', function() {
      const donationValue = '1';

      beforeEach(async function() {
        const donation = {from: donor, value: web3.utils.toWei(donationValue, 'ether')};
        await this.donations.methods.donate().send(donation);
      });

      it('increments token id', async function() {
        (await this.donations.methods.numEmittedTokens().call()).should.be.eq(`${donationValue}`);
      });

      it('mints tokens', async function() {
        (await this.token.methods.balanceOf(donor).call()).should.be.eq(`${donationValue}`);
      });
    });
  });
}
