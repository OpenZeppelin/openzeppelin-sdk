const index = require('../index');
index();

contract('Creating instances from Solidity', () => {
  it('should run the main script', async () => {
    await index(() => console.log(`Test completed!`));
  })
});
