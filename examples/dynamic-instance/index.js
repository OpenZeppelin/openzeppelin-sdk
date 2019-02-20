'use strict';

// global.artifacts = artifacts;
// global.web3 = web3;

// Import node dependencies.
const fs = require('fs');

// Import `zos` and `zos-lib` dependencies.
const zos = require('zos');
const lib = require('zos-lib');

// Main entry point, called by `truffle exec`.
async function main() {

  // Delete any previous ZeppelinOS files.
  console.log(`Deleting previous zos files...`);
  if(fs.existsSync('zos.json')) fs.unlinkSync('zos.json');
  if(fs.existsSync('zos.local.json')) fs.unlinkSync('zos.local.json');

  // Enable command loging in ZeppelinOS.
  const Logger = lib.Logger;
  Logger.silent(false);
  Logger.verbose(true);

  // Retrieve ZeppelinOS scripts.
  // These are analogous to `zos` commands.
  const { init, add, push, create, publish } = zos.scripts;

  // Initialize ZeppelinOS with Truffle's Web3 provider.
  console.log(`Initializing ZeppelinOS...`);
  const ZWeb3 = lib.ZWeb3;
  ZWeb3.initialize(web3.currentProvider);

  // Initialize the ZeppelinOS project.
  // Notice that publish is set to true, so that the project uses an App contract.
  await init({name: 'dynamic-instance', version: '0.1.0', publish: true});

  // Add the Factory.sol and Instance.sol contracts to the ZeppelinOS project.
  console.log(`Adding contracts...`);
  await add({contractsData: [
    {alias: 'Factory', name: 'Factory'},
    {alias: 'Instance', name: 'Instance'}
  ]});

  // Push the contracts implementations to the network.
  console.log(`Pushing contract implementations...`);
  await push({force: true, network: 'local'});

  // Retrieve the address of the project's App contract.
  const zosLocalData = require('./zos.local.json');
  const appAddress = zosLocalData.app.address;
  console.log(`App deployed at ${appAddress}.`);
}

// Required by `truffle exec`.
module.exports = function(callback) {
  main()
    .then(() => callback())
    .catch(err => callback(err));
};
