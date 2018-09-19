'use strict'
const main = require('../index.js').main;

contract('main', function(_accounts) {
  it('should run successfully', async function () {
    const instance = await main();
    const value = await instance.value();
    assert.equal(value.toNumber(), 43);
  })
});
