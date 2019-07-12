'use strict'
require('./setup')

import { Contracts, encodeCall } from '@openzeppelin/upgrades'
import shouldBehaveLikeDonations from './behaviors/Donations.behavior.js'

const DonationsV1 = Contracts.getFromLocal('DonationsV1')

contract('DonationsV1', ([_, owner, donor, wallet]) => {
  beforeEach(async function() {
    this.donations = await DonationsV1.new();
    await this.donations.methods.initialize(owner).send()
  });

  shouldBehaveLikeDonations(owner, donor, wallet);
});
