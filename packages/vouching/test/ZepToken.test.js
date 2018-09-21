const BigNumber = web3.BigNumber;

const ZepToken = artifacts.require('ZepToken');

contract('ZepToken', ([ _, owner]) => {
  beforeEach(async function () {
    this.zepToken = await ZepToken.new();
  });

  it('has a name', async function () {
    const name = await this.zepToken.name();
    assert.equal(name, "Zep Token");
  });

  it('has a symbol', async function () {
    const symbol = await this.zepToken.symbol();
    assert.equal(symbol, "ZEP");
  });

  it('has an amount of decimals', async function () {
    const decimals = await this.zepToken.decimals();
    assert.equal(decimals, 18);
  });

  it('has the correct total supply', async function () {
    const totalZEP = new BigNumber('100000000e18');
    (await this.zepToken.totalSupply()).should.be.bignumber.equal(totalZEP);
  })
});

