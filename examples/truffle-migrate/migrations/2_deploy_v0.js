// Load zos scripts and truffle wrapper function
const { add, push, create } = require('zos').scripts;
const Initializer = require('zos').Initializer;

async function deploy(options) {
  // Register v0 of MyContract in the zos project
  add({ contractsData: [{ name: 'MyContract_v0', alias: 'MyContract' }] });

  // Push implementation contracts to the network
  await push(options);

  // Create an instance of MyContract, setting initial value to 42
  await create(Object.assign({ contractAlias: 'MyContract', initMethod: 'initialize', initArgs: [42] }, options));
}

module.exports = function(deployer, network, accounts) {
  deployer.then(async () => {
    const { network, txParams } = await Initializer.call({ network, from: accounts[1] })
    await deploy({ network, txParams })
  })
}
