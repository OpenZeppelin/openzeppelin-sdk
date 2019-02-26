// Load zos scripts and truffle wrapper function
const { scripts, ConfigVariablesInitializer } = require('zos');
const { add, push, create } = scripts;

async function deploy(options) {
  // Register v0 of MyContract in the zos project
  add({ contractsData: [{ name: 'MyContract_v0', alias: 'MyContract' }] });

  // Push implementation contracts to the network
  await push(options);

  // Create an instance of MyContract, setting initial value to 42
  await create(Object.assign({ contractAlias: 'MyContract', initMethod: 'initialize', initArgs: [42] }, options));
}

module.exports = function(deployer, networkName, accounts) {
  deployer.then(async () => {
    const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration({ network: networkName, from: accounts[1] })
    await deploy({ network, txParams })
  })
}
