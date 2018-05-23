const { Contracts } = require('zos-lib')
const shouldBehaveLikeDonations = require('./Donations.behavior.js');

const DonationsV1 = Contracts.getFromLocal('DonationsV1');

contract('DonationsV1', ([_, owner, donor, wallet]) => {

  beforeEach(async function() {
    this.donations = await DonationsV1.new();
    await this.donations.initialize(owner);
  });

  shouldBehaveLikeDonations(owner, donor, wallet);
});
