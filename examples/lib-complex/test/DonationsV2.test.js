'use strict'
require('./setup')

import { Contracts, encodeCall } from 'zos-lib'
import shouldBehaveLikeDonationsWithTokens from './behaviors/DonationsWithTokens.behavior.js'

const DonationsV2 = Contracts.getFromLocal('DonationsV2');
const ERC721Mintable = Contracts.getFromLocal('ERC721Mintable');

const sendTransaction = (target, method, args, values, opts) => {
  const data = encodeCall(method, args, values);
  return target.sendTransaction(Object.assign({ data }, opts));
};

contract('DonationsV2', ([_, owner, donor, wallet]) => {
  beforeEach(async function() {
    this.donations = await DonationsV2.new();
    await sendTransaction(this.donations, 'initialize', ['address'], [owner]);

    this.token = await ERC721Mintable.new();
    await sendTransaction(
      this.token,
      'initialize',
      ['address'],
      [this.donations.address]
    );
    await this.donations.methods.setToken(this.token.address).send({ from: owner });
  });

  shouldBehaveLikeDonationsWithTokens(owner, donor, wallet);
});
