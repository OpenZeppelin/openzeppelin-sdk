'use strict'
require('./setup')

import { Contracts, encodeCall } from 'zos-lib'
import shouldBehaveLikeDonationsWithTokens from './behaviors/DonationsWithTokens.behavior.js'

const DonationsV2 = Contracts.getFromLocal('DonationsV2');
const MintableERC721Token = Contracts.getFromLocal('MintableERC721Token');

const sendTransaction = (target, method, args, values, opts) => {
  const data = encodeCall(method, args, values);
  return target.sendTransaction(Object.assign({ data }, opts));
};
  
contract('DonationsV2', ([_, owner, donor, wallet]) => {
  const tokenName = 'DonationToken';
  const tokenSymbol = 'DON';

  beforeEach(async function() {
    this.donations = await DonationsV2.new();
    await sendTransaction(this.donations, 'initialize', ['address'], [owner]);

    this.token = await MintableERC721Token.new();
    await sendTransaction(
      this.token,
      'initialize',
      ['address', 'string', 'string'],
      [this.donations.address, tokenName, tokenSymbol]
    );
    await this.donations.setToken(this.token.address, { from: owner });
  });

  shouldBehaveLikeDonationsWithTokens(owner, donor, wallet, tokenName, tokenSymbol);
});
