const index = require('../index');
index();

contract('Creating instances from Solidity', () => {
  it('should run the main script', async () => {
    const value = await index();
    assert.equal(value, 42, "final value returned by script is incorrect.");
  })
});
