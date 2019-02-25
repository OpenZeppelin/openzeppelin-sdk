// Load zos scripts and truffle wrapper function
const { ConfigVariablesInitializer, scripts } = require('zos');
const { add, push, update } = scripts;

async function deploy(options) {
  // Register v1 of MyContract in the zos project as MyContract
  add({ contractsData: [{ name: 'MyContract_v1', alias: 'MyContract' }] });

  // Push implementation contracts to the network
  await push(options);

  // Update instance, adding +10 to value as part of the migration
  await update(Object.assign({ contractAlias: 'MyContract', initMethod: 'add', initArgs: [10] }, options));
}

module.exports = function(deployer, networkName, accounts) {
  deployer.then(async () => {
    const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration({ network: networkName, from: accounts[1] })
    await deploy({ network, txParams })
  })
}
