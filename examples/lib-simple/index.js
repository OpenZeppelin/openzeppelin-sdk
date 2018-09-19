'use strict';

// Required by zos-lib when running from truffle
global.artifacts = artifacts;
global.web3 = web3;

const { Contracts, SimpleProject  } = require('zos-lib')
const MyContract_v0 = Contracts.getFromLocal('MyContract_v0');
const MyContract_v1 = Contracts.getFromLocal('MyContract_v1');

async function main() {
  const creatorAddress = web3.eth.accounts[1],
        initializerAddress = web3.eth.accounts[2],
        myProject = new SimpleProject('MyProject', { from: creatorAddress }, { from: initializerAddress });

  log('Creating an upgradeable instance of v0...');
  const instance = await myProject.createProxy(MyContract_v0, { initArgs: [42] })
  log('Contract\'s storage value: ' + (await instance.value()).toString() + '\n');
  
  log('Upgrading to v1...');
  await myProject.upgradeProxy(instance, MyContract_v1, { initMethod: 'add', initArgs: [1] })
  log('Contract\'s storage new value: ' + (await instance.value()).toString() + '\n');
  
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