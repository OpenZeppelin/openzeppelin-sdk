'use strict';

const MyContract_v0 = artifacts.require('MyContract_v0');
const MyContract_v1 = artifacts.require('MyContract_v1');
const OwnedUpgradeabilityProxy = artifacts.require('zos-lib/contracts/upgradeability/OwnedUpgradeabilityProxy.sol');


module.exports = async function() {

  console.log('Deploying MyContract v0 implementation...');
  const implementation_v0 = await MyContract_v0.new();

  console.log('Deploying a proxy pointing to that implementation...')
  const proxy = await OwnedUpgradeabilityProxy.new(implementation_v0.address);

  console.log('Calling initialize(42) on proxy...');
  let myContract = await MyContract_v0.at(proxy.address);
  const x0 = 42;
  await myContract.initialize(x0);

	console.log('Proxy\'s storage value for x: ' + (await myContract.x()).toString());


  console.log('Deploying MyContract_v1, the v1 implementation...')
  const implementation_v1 = await MyContract_v1.new();

  console.log('Upgrading proxy to v1 implementation...');
  await proxy.upgradeTo(implementation_v1.address);
  myContract = await MyContract_v1.at(proxy.address);

  console.log('Proxy\'s storage value for x: ' + (await myContract.x()).toString())
  console.log('Proxy\'s storage value for y: ' + (await myContract.y()).toString())
  console.log('Wohoo! We\'ve upgraded our contract\'s behavior while preserving storage.');

};

