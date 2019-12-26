const Web3 = require('web3');

const { provider } = require('@openzeppelin/test-environment');
const main = require('../index.js').main;
const assert = require('chai').assert;

describe('main', function() {
  it('upgrades the contract successfully', async function () {
    const web3 = new Web3(provider);
    const instance = await main(web3);
    assert.isString(instance.address);
    const value = await instance.methods.value().call();
    assert.equal(value, 52);
  })
});
