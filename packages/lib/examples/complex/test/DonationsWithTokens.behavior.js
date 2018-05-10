import assertRevert from 'zos-lib/src/helpers/assertRevert';

const shouldBehaveLikeDonations = require('./Donations.behavior.js');
const getBalance = require('./helpers/getBalance.js');
const should = require('chai').should();

module.exports = function(owner, donor, wallet, tokenName, tokenSymbol) {

  shouldBehaveLikeDonations(owner, donor, wallet);

  describe('token', function() {

    it('is owned by the contract', async function() {
      (await this.token.owner()).should.be.eq(this.donations.address);
    });

    it('has the correct token name', async function() {
      (await this.token.name()).should.be.eq(tokenName);
    });

    it('has the correct token symbol', async function() {
      (await this.token.symbol()).should.be.eq(tokenSymbol);
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
