'use strict'
require('./setup');
const main = require('../index.js').main;

contract('main', function(_accounts) {
  let instance;

  it('initialize successfully', async function () {
    instance = await main(_accounts[1], _accounts[2]);
    assert.isString(instance.address);
  })
  
  it('set and update the value successfully', async function () {
    const value = await instance.methods.value().call();
    assert.equal(value, 43);
  })
});
