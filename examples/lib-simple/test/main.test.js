'use strict'
require('./setup');
const main = require('../index.js').main;

contract('main', function([creatorAddress, initializerAddress]) {
  let instance;

  it('set and update the value successfully', async function () {
    instance = await main();
    assert.isString(instance.address);
    const value = await instance.methods.value().call({ from: initializerAddress });
    assert.equal(value, 43);
  })
});
