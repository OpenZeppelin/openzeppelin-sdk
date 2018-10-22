'use strict'
require('../setup')

import { assertRevert } from 'zos-lib'
import shouldBehaveLikeDonations from './Donations.behavior.js'

export default function(owner, donor, wallet, tokenName, tokenSymbol) {
  shouldBehaveLikeDonations(owner, donor, wallet);

  describe('token', function() {
    it('is mintable by the contract', async function() {
      (await this.token.isMinter(this.donations.address)).should.equal(true);
    });

    it('cannot be set a second time', async function() {
      await assertRevert(
        this.donations.setToken(this.token.address, {from: owner})
      );
    });

    it('is the token set in the donations contract', async function() {
      (await this.donations.token()).should.be.eq(this.token.address);
    });

  });

  describe('donate', function() {

    describe('when receiving a donation that is greater than zero', function() {
      const donationValue = 1;

      beforeEach(async function() {
        const donation = {from: donor, value: web3.toWei(donationValue, 'ether')};
        await this.donations.donate(donation);
      });

      it('increments token id', async function() {
        (await this.donations.numEmittedTokens()).toNumber().should.be.eq(donationValue);
      });

      it('mints tokens', async function() {
        (await this.token.balanceOf(donor)).toNumber().should.be.eq(donationValue);
      });
    });
  });
}
