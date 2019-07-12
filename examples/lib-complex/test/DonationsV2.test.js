'use strict'
require('./setup')

import { Contracts, encodeCall } from '@openzeppelin/upgrades'
import shouldBehaveLikeDonationsWithTokens from './behaviors/DonationsWithTokens.behavior.js'

const DonationsV2 = Contracts.getFromLocal('DonationsV2');
const ERC721Mintable = Contracts.getFromLocal('ERC721Mintable');

contract('DonationsV2', ([_, owner, donor, wallet]) => {
  beforeEach(async function() {
    this.donations = await DonationsV2.new();
    await this.donations.methods.initialize(owner).send();

    this.token = await ERC721Mintable.new();
    await this.token.methods.initialize(this.donations.address).send();
    await this.donations.methods.setToken(this.token.address).send({ from: owner });
  });

  shouldBehaveLikeDonationsWithTokens(owner, donor, wallet);
});
