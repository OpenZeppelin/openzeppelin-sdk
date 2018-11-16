// Load zos scripts and truffle wrapper function
const { add, push, update } = require('zos').scripts;
const runWithTruffle = require('zos').runWithTruffle;

async function deploy(options) {
  // Register v1 of MyContract in the zos project as MyContract
  add({ contractsData: [{ name: 'MyContract_v1', alias: 'MyContract' }] });

  // Push implementation contracts to the network
  await push(options);

  // Update instance, adding +10 to value as part of the migration
  await update(Object.assign({ contractAlias: 'MyContract', initMethod: 'add', initArgs: [10] }, options));
}

module.exports = function(deployer, network, accounts) {
  deployer.then(() => 
    runWithTruffle(deploy, { network, from: accounts[1], dontExitProcess: true })
  );
}
