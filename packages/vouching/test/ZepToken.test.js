const BigNumber = web3.BigNumber;

const ZepToken = artifacts.require('ZepToken');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ZepToken', ([ _, owner]) => {
  beforeEach(async function () {
    this.zepToken = await ZepToken.new();
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
});

