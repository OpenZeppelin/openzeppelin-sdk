import { assertRevert } from 'zos-lib';

const getBalance = require('./helpers/getBalance.js');
const should = require('chai').should();

module.exports = function(owner, donor, wallet) {

  describe('donate', function () {

    describe('when the donation is zero', function() {

      let donation;

      beforeEach(function() {
        donation = {from: donor, value: web3.toWei(0, 'ether')};
      });

      it('reverts', async function() {
        await assertRevert(
          this.donations.donate(donation)
        );
      });

    });

    describe('when the donation is greater than zero', function() {

      let donation;

      beforeEach(function() {
        donation = {from: donor, value: web3.toWei(1, 'ether')};
      });

      it('accepts the donation', async function() {
        await this.donations.donate(donation);
      });

      it('increases contract balance', async function() {
        await this.donations.donate(donation);
        (await getBalance(this.donations.address)).should.be.above(0);
      });

    });
  });

  describe('withdraw', function() {

    describe('when called by the owner', function() {

      let caller;

      beforeEach(function() {
        caller = owner;
      });

      it('transfers all funds to the designated wallet', async function() {
        const initialWalletBalance = await getBalance(wallet);
        await this.donations.donate({from: donor, value: web3.toWei(1, 'ether')});
        await this.donations.withdraw(wallet, {from: caller});
        (await getBalance(wallet)).should.be.eq(initialWalletBalance + 1);
      });

    });

    describe('when called by someone who is not the owner', function() {

      let caller;

      beforeEach(function() {
        caller = donor;
      });

      it('reverts', async function() {
        await assertRevert(
          this.donations.withdraw(donor, {from: caller})
        );
      });

    });

  });

  describe('getDonationBalance', function() {

    let caller;

    beforeEach(function() {
      caller = donor;
    });

    describe('when called for someone who has made a donation', async function() {

      beforeEach(async function() {
        const donation = {from: caller, value: web3.toWei(1, 'ether')};
        await this.donations.donate(donation);
      });

      it('returns the donors balance', async function() {
        const donation = (await this.donations.getDonationBalance(donor)).toNumber(); 
        const donationNum = parseInt(web3.fromWei(donation, 'ether'), 10);
        donationNum.should.be.eq(1);
      });

    });

    describe('when called for someone who has not made a donation', function() {

      it('returns the donors balance', async function() {
        const donation = (await this.donations.getDonationBalance(donor)).toNumber(); 
        const donationNum = parseInt(web3.fromWei(donation, 'ether'), 10);
        donationNum.should.be.eq(0);
      });

    });

  });
}
