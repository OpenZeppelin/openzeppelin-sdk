const { encodeCall, assertRevert } = require('zos-lib')
const BigNumber = web3.BigNumber;

const ZEPToken = artifacts.require('ZEPToken');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ZEPToken', ([ _, owner, another, jurisdiction]) => {
  const attributeID = 0;

  beforeEach('deploy and initialize ZEP token', async function () {
    this.zepToken = await ZEPToken.new({ from: owner });
    const initializeData = encodeCall('initialize', ['address', 'uint256'], [jurisdiction, attributeID]);
    await this.zepToken.sendTransaction({ data: initializeData, from: owner });
  });

  it('has a name', async function () {
    const name = await this.zepToken.name({ from: another });
    name.should.be.equal('ZeppelinOS Token');
  });

  it('has a symbol', async function () {
    const symbol = await this.zepToken.symbol({ from: another });
    symbol.should.be.equal('ZEP');
  });

  it('has an amount of decimals', async function () {
    const decimals = await this.zepToken.decimals({ from: another });
    decimals.should.be.bignumber.equal(18);
  });

  it('has the correct total supply', async function () {
    const totalZEP = new BigNumber('100000000e18');
    (await this.zepToken.totalSupply({ from: another })).should.be.bignumber.equal(totalZEP);
  })

  it('can be paused by creator', async function () {
    await this.zepToken.pause({ from: owner });
  })

  it('cannot be paused by anybody', async function () {
    await assertRevert(this.zepToken.pause({ from: another }));
  })
});

