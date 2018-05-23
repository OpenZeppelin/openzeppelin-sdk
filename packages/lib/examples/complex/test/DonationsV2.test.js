const { Contracts } = require('zos-lib')
const shouldBehaveLikeDonationsWithTokens = require('./DonationsWithTokens.behavior.js');

const DonationsV2 = Contracts.getFromLocal('DonationsV2');
const MintableERC721Token = Contracts.getFromLocal('MintableERC721Token');

contract('DonationsV2', ([_, owner, donor, wallet]) => {

  let tokenName = 'DonationToken';
  let tokenSymbol = 'DON';

  beforeEach(async function() {

    this.donations = await DonationsV2.new();
    await this.donations.initialize(owner);

    this.token = await MintableERC721Token.new();
    await this.token.initialize(this.donations.address, tokenName, tokenSymbol);
    await this.donations.setToken(this.token.address, {from: owner});
  });

  shouldBehaveLikeDonationsWithTokens(owner, donor, wallet, tokenName, tokenSymbol);
});
