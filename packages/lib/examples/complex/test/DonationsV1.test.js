const DonationsV1 = artifacts.require('DonationsV1');
const shouldBehaveLikeDonations = require('./Donations.behavior.js');

contract('DonationsV1', ([_, owner, donor, wallet]) => {

  beforeEach(async function() {
    this.donations = await DonationsV1.new();
    await this.donations.initialize(owner);
  });

  shouldBehaveLikeDonations(owner, donor, wallet);
});
