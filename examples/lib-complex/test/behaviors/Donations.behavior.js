import { assertRevert } from '@openzeppelin/upgrades'
import getBalance from '../helpers/getBalance.js'

export default function(owner, donor, wallet) {
  const ETH_1 = web3.toWei(1, 'ether');

  describe('donate', function () {
    const from = donor

    describe('when the donation is zero', function() {
      const value = web3.toWei(0, 'ether')

      it('reverts', async function() {
        await assertRevert(this.donations.methods.donate().send({ from, value }))
      })
    })

    describe('when the donation is greater than zero', function() {
      const value = ETH_1

      it('increases contract balance', async function() {
        const receipt = await this.donations.methods.donate().send({ from, value })

        const balance = await getBalance(this.donations.address);
        balance.should.be.above(0)
      });
    });
  });

  describe('withdraw', function() {
    beforeEach('donating 1 ETH', async function () {
      await this.donations.methods.donate().send({ from: donor, value: ETH_1 })
    })

    describe('when called by the owner', function() {
      const from = owner

      it('transfers all funds to the designated wallet', async function() {
        const initialWalletBalance = await getBalance(wallet)

        await this.donations.methods.withdraw(wallet).send({ from })

        const currentBalance = await getBalance(wallet);
        currentBalance.should.be.eq(initialWalletBalance + 1);
      });
    });

    describe('when called by someone who is not the owner', function() {
      const from = donor

      it('reverts', async function() {
        await assertRevert(this.donations.methods.withdraw(wallet).send({ from }))
      });
    });
  });

  describe('getDonationBalance', function() {
    beforeEach('donating 1 ETH', async function () {
      await this.donations.methods.donate().send({ from: donor, value: ETH_1})
    });

    describe('when called for someone who has made a donation', async function() {
      const from = donor

      it('returns the donors balance', async function() {
        const donation = parseInt(await this.donations.methods.getDonationBalance(from).call(), 10);
        const donationNum = parseInt(web3.fromWei(donation, 'ether'), 10);
        donationNum.should.be.eq(1);
      });
    });

    describe('when called for someone who has not made a donation', function() {
      const from = owner

      it('returns zero', async function() {
        const donation = parseInt(await this.donations.methods.getDonationBalance(from).call(), 10);
        const donationNum = parseInt(web3.fromWei(donation, 'ether'), 10);
        donationNum.should.be.eq(0);
      });
    });
  });
}
