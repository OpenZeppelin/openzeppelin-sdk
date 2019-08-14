'use strict';

/*
  This script demonstrates how an OpenZeppelin SDK contract can be used
  to create instances of upgradeable contracts from another contract,
  as opposed to only being able to create them via the `openzeppelin` CLI.

  Note that this is done programmatically with this script for 
  illustration purposes, but the entire process can be done from the `openzeppelin` CLI.
  */

// Import node dependencies.
const fs = require('fs');

// Retrieve @openzeppelin/cli scripts.
// These are analogous to `openzeppelin` CLI commands.
const { init, add, push, create } = require('@openzeppelin/cli').scripts;

// Import @openzeppelin/upgrades dependencies.
const { ZWeb3, Contracts, encodeCall } = require('@openzeppelin/upgrades');

// Main entry point, called by `truffle exec`.
async function main() {

  // Retrieve the name of the network being used.
  const network = process.argv[process.argv.length - 1];
  console.log(`Running script with the ${network} network...`);

  // Delete any previous OpenZeppelin SDK files.
  console.log(`Deleting previous project files...`);
  if(fs.existsSync('.openzeppelin/project.json')) fs.unlinkSync('.openzeppelin/project.json');
  if(fs.existsSync(`.openzeppelin/${network}.json`)) fs.unlinkSync(`.openzeppelin/${network}.json`);

  // Initialize OpenZeppelin SDK with Truffle's Web3 provider.
  console.log(`Initializing OpenZeppelin SDK...`);
  ZWeb3.initialize(web3.currentProvider);

  // Set the default parameters to be used in future transactions.
  Contracts.setArtifactsDefaults({
    gas: 6721975,
    gasPrice: 100000000000
  });

  // Retrieve the default transaction params.
  // This will include a default `from` address.
  const txParams = await Contracts.getDefaultTxParams();
  console.log(`Default params to be used in transactions:`, txParams);

  // Initialize the OpenZeppelin SDK project.
  // Notice that publish is set to true, so that the project uses an App contract.
  // This App contract will be used from within Factory.sol to dynamically create
  // proxy instances from the contract itself.
  await init({name: 'creating-instances-from-solidity', version: '0.1.0', publish: true});

  // Add the Factory.sol and Instance.sol contracts to the OpenZeppelin SDK project.
  console.log(`Adding contracts...`);
  await add({contractsData: [
    {alias: 'Factory', name: 'Factory'},
    {alias: 'Instance', name: 'Instance'}
  ]});

  // Push the contracts implementations to the network.
  console.log(`Pushing contract implementations...`);
  await push({force: true, network });

  // Retrieve the address of the project's App contract.
  // This address will be passed to an instance of the Factory contract,
  // so that it can call the App contract's create function.
  const ozLocalData = require(`./.openzeppelin/${network}.json`);

  const appAddress = ozLocalData.app.address;
  console.log(`App deployed at ${appAddress}.`);

  // Create and initialize a proxy instance of the Factory contract.
  console.log(`Creating proxy instance of Factory.sol...`);
  const factoryProxy = await create({
    packageName: 'creating-instances-from-solidity',
    contractAlias: 'Factory',
    methodName: 'initialize',
    methodArgs: [appAddress],
    network
  });
  console.log(`Factory proxy created at ${factoryProxy.address}`);

  // Use the Factory proxy address to create a javascript Factory contract object.
  const factoryContract = Contracts.getFromLocal('Factory').at(factoryProxy.address);

  // Construct the call data for the initialize method of Instance.sol.
  // This call data consists of the contract's `initialize` method with the value of `42`.
  const data = encodeCall('initialize', ['uint256'], [42]);
  console.log(`Call data for Instance.sol's initialize: ${data}`);

  // TODO: Ideally, we'd want to retrieve the ProxyAdmin and forward that address
  // to the Factory's createInstance method. The problem is that the ProxyAdmin is created
  // lazily, and is not available at this time. Once this is changed,
  // we can also remove the reference to the transparent proxy problem 
  // from a few lines below.

  // Create and initialize a proxy instance of the Instance contract,
  // but do so via the Factory contract instead of using the create script.
  // This is the main concept of this example: proxies can be created from deployed contracts.
  console.log(`Creating proxy instance of Instance.sol (via Factory.sol)...`);
  const transactionReceipt = await factoryContract.methods.createInstance(data).send(txParams);
  const uint256ToAddress = require('@openzeppelin/upgrades/lib/utils/Addresses.js').uint256ToAddress;
  const instanceAddress = uint256ToAddress(transactionReceipt.events['0'].raw.data);
  console.log(`Instance proxy created at ${instanceAddress}`);

  // Use the Instance proxy address to create a javascript Instance contract object.
  const instanceContract = Contracts.getFromLocal('Instance').at(instanceAddress);

  // Retrieve the value stored in the instance contract.
  // Note that we cannot make the call using the same address that created the proxy
  // because of the transparent proxy problem. See: https://docs.openzeppelin.com/sdk/2.5/faq#why-am-i-getting-the-error-cannot-call-fallback-function-from-the-proxy-admin
  const anotherAccount = (await ZWeb3.accounts())[1];
  const value = await instanceContract.methods.value().call({ ...txParams, from: anotherAccount });
  console.log(`Retrieved value from the created Instance contract: ${value}`);

  return value;
}

// Required by `truffle exec`.
module.exports = function(callback) {
  return new Promise((resolve, reject) => {
    main()
      .then((value) => resolve(value))
      .catch(err => { 
        console.log(`Error:`, err);
        reject(err) 
      });
  });
};
