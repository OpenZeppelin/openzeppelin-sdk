const decodeLogs = require('zos-lib').decodeLogs;
const encodeCall = require('zos-lib').decodeLogs;

const OwnedUpgradeabilityProxy = artifacts.require('zos-lib/contracts/upgradeability/OwnedUpgradeabilityProxy.sol');
const UpgradeabilityProxyFactory = artifacts.require('UpgradeabilityProxyFactory');
const Package = artifacts.require('Package');
const AppDirectory = artifacts.require('AppDirectory');
const AppManager = artifacts.require('PackagedAppManager');

const DonationsV1 = artifacts.require('DonationsV1');
const DonationsV2 = artifacts.require('DonationsV2');

const stdlib = "0xA739d10Cc20211B973dEE09DB8F0D75736E2D817";
const owner = web3.eth.accounts[1];
const contractName = "Donations";
const txParams = {
  from: owner,
  gas: 2000000,
  gasPrice: 100000000000
};

async function setupAppManager() {

  const initialVersion = '0.0.1';

  console.log("<< Setting up AppManager >>");

  // Setup a proxy factory that will be in charge of creating proxy contracts
  // for all of the project's upgradeable contracts.
  console.log(`Deploying proxy factory...`);
  this.factory = await UpgradeabilityProxyFactory.new(txParams);
  console.log(`Deployed proxy factory at ${this.factory.address}`);

  // A package keeps track of the project's versions, each of which is a
  // contract directory, i.e. a list of contracts.
  console.log(`Deploying application package...`);
  this.package = await Package.new(txParams);
  console.log(`Deployed application package at ${this.package.address}`);

  // For each version, a directory keeps track of the project's contract implementations.
  console.log(`Deploying application directory for version ${initialVersion}...`);
  this.directory = await AppDirectory.new(0, txParams);
  console.log(`Deployed application directory for initial version at ${this.directory.address}`);

  // Initialize the package with the first contract directory.
  console.log(`Adding version to package...`);
  await this.package.addVersion(initialVersion, this.directory.address, txParams);
  console.log(`Added application directory to package`);

  // With a proxy factory and a package, the project's app manager is bootstrapped and ready for use.
  console.log(`Deploying application manager...`);
  this.appManager = await AppManager.new(this.package.address, initialVersion, this.factory.address, txParams);
  console.log(`Deployed application manager at ${this.appManager.address}`);
}

async function deployVersion1Implementation() {

  console.log("\n<< Deploying version 1 >>");

  // Deploy an implementation that defines the behavior of the main contract.
  console.log(`Deploying first implementation of ${contractName}...`);
  const implementation = await DonationsV1.new(txParams);
  console.log(`Deployed first implementation at ${implementation.address}`);

  // Register the implementation in the current version of the app.
  console.log(`Registering implementation...`);
  await this.directory.setImplementation(contractName, implementation.address, txParams);
  console.log(`Registered implementation in current contract directory`);

  // Create a proxy that wraps the implementation, making it upgradeable.
  // At this point, the proxy's address is usable by any dapp, but can also be upgraded
  // without having to use a new address or losing the contract's storage.
  console.log(`Creating proxy for ${contractName}...`);
  const callData = encodeCall('initialize', ['address'], [owner]);
  const {receipt} = await this.appManager.createAndCall(contractName, callData, txParams);
  console.log(JSON.stringify(receipt, null, 2));
  const logs = decodeLogs([receipt.logs[1]], UpgradeabilityProxyFactory, 0x0);
  const proxyAddress = logs.find(l => l.event === 'ProxyCreated').args.proxy;
  this.proxy = OwnedUpgradeabilityProxy.at(proxyAddress);
  console.log(`Proxy for ${contractName} created at ${proxyAddress}`);
}

async function deployVersion2() {

  console.log("\n<< Deploying version 2 >>");

  const versionName = '0.0.2';

  // Prepare a new version for the app that will hold the new implementation for the main contract.
  console.log(`Deploying new application directory...`);
  this.directory = await AppDirectory.new(stdlib, txParams);
  console.log(`Deployed application directory for new version ${versionName} at ${this.directory.address}`);

  // Deploy contract implementation.
  console.log(`Deploying new contract implementation...`);
  const implementation = await DonationsV2.new(txParams);
  console.log(`Deploying new implementation of ${contractName} at ${implementation.address}`);

  // Register the new implementation in the current version.
  console.log(`Registering new contract implementation...`);
  await this.directory.setImplementation(contractName, implementation.address, txParams);
  console.log(`Registered implementation in current contract directory`);

  // Create a new application version with the new directory and
  // update the app's version to it.
  console.log(`Adding new application version ${versionName}`);
  await this.package.addVersion(versionName, this.directory.address, txParams);
  console.log(`Setting the app's version to ${versionName}`);
  await this.appManager.setVersion(versionName, txParams);

  // Upgrade the proxy to the application's latest version.
  console.log(`Upgrading proxy for ${contractName}`);
  await this.appManager.upgradeTo(this.proxy.address, contractName, txParams);
  console.log(`Upgraded contract proxy for ${contractName} to latest app version ${versionName}`);

  // Add an ERC721 token implementation to the project.
  console.log(`Creating proxy for ERC721 token, for use in ${contractName}...`);
  const {receipt} = await this.appManager.create('MintableERC721Token', txParams);
  const logs = decodeLogs([receipt.logs[1]], UpgradeabilityProxyFactory, 0x0);
  const proxyAddress = logs.find(l => l.event === 'ProxyCreated').args.proxy;
  console.log(`Token proxy created at ${proxyAddress}`);

  // Set the token in the new implementation.
  console.log(`Setting application's token...`);
  const donations = DonationsV2.at(this.proxy.address);
  await donations.setToken(proxyAddress, txParams);
  console.log(`Token set succesfully`);
}

module.exports = async function() {
  await setupAppManager();
  await deployVersion1Implementation();
  await deployVersion2();
};
