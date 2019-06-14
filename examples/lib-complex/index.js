'use strict';

global.artifacts = artifacts;

const args = require('minimist')(process.argv.slice(2));
const network = args.network;

const { AppProject, Contracts, ImplementationDirectory, Package } = require('zos-lib')

const ERC721Mintable = Contracts.getFromLocal('ERC721Mintable');

const contractName = 'Donations';
const tokenClass = 'ERC721Mintable';

async function setupApp(txParams) {

  // On-chain, single entry point of the entire application.
  console.error(`<< Setting up App >> network: ${network}`)
  const initialVersion = '0.0.1'
  return await AppProject.fetchOrDeploy('complex-example', initialVersion, txParams, {})
}

async function deployVersion1(project, owner) {

  // Register the first implementation of 'Donations', and request a proxy for it.
  console.error('<< Deploying version 1 >>')
  const DonationsV1 = Contracts.getFromLocal('DonationsV1')
  await project.setImplementation(DonationsV1, contractName);
  return await project.createProxy(DonationsV1, { contractName, initMethod: 'initialize', initArgs: [owner] })
}

async function deployVersion2(project, donations, txParams) {

  // Create a new version of the project, linked to the ZeppelinOS EVM package.
  // Register a new implementation for 'Donations' and upgrade it's proxy to use the new implementation.
  console.error('<< Deploying version 2 >>')
  const secondVersion = '0.0.2'
  await project.newVersion(secondVersion)

  const dependencyName = 'openzeppelin';
  const [dependencyAddress, dependencyVersion] = await getLibrary(txParams)
  await project.setDependency('openzeppelin', dependencyAddress, dependencyVersion)

  const DonationsV2 = Contracts.getFromLocal('DonationsV2')
  await project.setImplementation(DonationsV2, contractName);
  await project.upgradeProxy(donations.address, DonationsV2, { contractName })
  donations = DonationsV2.at(donations.address)

  // Add an ERC721 token implementation to the project, request a proxy for it,
  // and set the token on 'Donations'.
  console.error(`Creating ERC721 token proxy to use in ${contractName}...`)
  const token = await project.createProxy(ERC721Mintable, {
    packageName: 'openzeppelin',
    contractName: tokenClass,
    initMethod: 'initialize',
    initArgs: [donations.address]
  })
  console.error(`Token proxy created at ${token.address}`)
  console.error('Setting application\'s token...')
  await donations.methods.setToken(token.address).send(txParams)
  console.error('Token set succesfully')
  return token;
}

async function getLibrary(txParams) {

  // Use deployed EVM package, or simulate one in local networks.
  // TODO: Install and link openzeppelin-zos here, instead of manually building a mock
  if(!network || network === 'local') {
    const version = '1.0.0';
    const thepackage = await Package.deploy(txParams);
    const directory = await thepackage.newVersion(version);
    const tokenImplementation = await ERC721Mintable.new();
    await directory.setImplementation(tokenClass, tokenImplementation.address);
    return [thepackage.address, version];
  } else {
    throw Error("Unknown network " + network);
  }
}

module.exports = async function() {
  const owner = web3.eth.accounts[1];
  const txParams = {
    from: owner,
    gas: 3000000,
    gasPrice: 100000000000
  };
  const app = await setupApp(txParams);
  const donations = await deployVersion1(app, owner);
  await deployVersion2(app, donations, txParams);
};

// Used in tests:
module.exports.setupApp = setupApp;
module.exports.deployVersion1 = deployVersion1;
module.exports.deployVersion2 = deployVersion2;
