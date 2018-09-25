const { encodeCall, assertRevert } = require('zos-lib')
const BigNumber = web3.BigNumber;

const ZepToken = artifacts.require('ZepToken');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('TPLToken', ([ _, owner, another, jurisdiction]) => {
  const attributeID = 0;

  beforeEach('deploy and initialize ZEP token', async function () {
    this.zepToken = await ZepToken.new();
    const initializeData = encodeCall('initialize', ['address', 'uint256'], [jurisdiction, attributeID]);
    await this.zepToken.sendTransaction({ data: initializeData });
  });

  it('has a name', async function () {
    const name = await this.zepToken.name();
    name.should.be.equal('Zep Token');
  });

  it('has a symbol', async function () {
    const symbol = await this.zepToken.symbol();
    symbol.should.be.equal('ZEP');
  });

  it('has an amount of decimals', async function () {
    const decimals = await this.zepToken.decimals();
    decimals.should.be.bignumber.equal(18);
  });

  it('has the correct total supply', async function () {
    const totalZEP = new BigNumber('100000000e18');
    (await this.zepToken.totalSupply()).should.be.bignumber.equal(totalZEP);
  })

  it('can be paused by creator', async function () {
    await this.zepToken.pause();
  })

  it('cannot be paused by anybody', async function () {
    await assertRevert(this.zepToken.pause({ from: another }));
  })
});

