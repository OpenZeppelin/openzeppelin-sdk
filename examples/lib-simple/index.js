'use strict';

// Required by zos-lib when running from truffle
global.artifacts = artifacts;

const { Contracts, SimpleProject } = require('zos-lib')
const MyContract_v0 = Contracts.getFromLocal('MyContract_v0');
const MyContract_v1 = Contracts.getFromLocal('MyContract_v1');

async function main(creatorAddress, initalizerAddress) {
  const myProject = new SimpleProject('MyProject', { from: creatorAddress });

  /* Deploy the contract with a proxy that allows upgrades. Initialize it by setting the value to 42. */
  log('Creating an upgradeable instance of v0...');
  const instance = await myProject.createProxy(MyContract_v0, { initArgs: [42] })
  log('Contract\'s storage value: ' + (await instance.methods.value().call()).toString() + '\n');
  
  /* Upgrade the contract at the address of our instance to the new logic, and initialize with a call to add. */
  log('Upgrading to v1...');
  await myProject.upgradeProxy(instance.address, MyContract_v1, { initMethod: 'add', initArgs: [1], initFrom: initalizerAddress })
  log('Contract\'s storage new value: ' + (await instance.methods.value().call()).toString() + '\n');
  
  log('Wohoo! We\'ve upgraded our contract\'s behavior while preserving its storage, thus obtaining 43.');
  return instance
}

// For truffle exec
module.exports = function(callback) {
  main().then(() => callback()).catch(err => callback(err))
};

// Logging
function log() {
  if (process.env.NODE_ENV !== 'test') {
    console.log.apply(this, arguments)
  }
}

// Testing
module.exports.main = main;
