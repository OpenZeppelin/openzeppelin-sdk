'use strict';

const { Contracts } = require('zos-lib')
const MyContract_v0 = Contracts.getFromLocal('MyContract_v0');
const MyContract_v1 = Contracts.getFromLocal('MyContract_v1');
const AdminUpgradeabilityProxy = Contracts.getFromNodeModules('zos-lib', 'AdminUpgradeabilityProxy');

module.exports = async function() {
  console.log('Deploying MyContract v0...');
  const myContract_v0 = await MyContract_v0.new();

  console.log('Deploying a proxy pointing to v0...');
  const proxy = await AdminUpgradeabilityProxy.new(myContract_v0.address);

  console.log('Calling initialize(42) on proxy...');
  let myContract = await MyContract_v0.at(proxy.address);
  const value = 42;
  await myContract.initialize(value);
  console.log('Proxy\'s storage value: ' + (await myContract.value()).toString());

  console.log('Deploying MyContract v1...');
  const myContract_v1 = await MyContract_v1.new();

  console.log('Upgrading proxy to v1...');
  await proxy.upgradeTo(myContract_v1.address);
  myContract = await MyContract_v1.at(proxy.address);

  await myContract.add(1);
  console.log('Proxy\'s storage new value: ' + (await myContract.value()).toString());
  console.log('Wohoo! We\'ve upgraded our contract\'s behavior while preserving its storage, thus obtaining 43.');
};
