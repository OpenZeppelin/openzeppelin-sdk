'use strict';

global.artifacts = artifacts;
global.ContractsProvider = require('zos-lib/src/utils/ContractsProvider').default;

const args = require('minimist')(process.argv.slice(2));
const network = args.network;

const ImplementationDirectory = artifacts.require('ImplementationDirectory');
const MintableERC721Token = artifacts.require('MintableERC721Token');
const { Logger, AppDeployer, ContractsProvider } = require('zos-lib')
const log = new Logger('ComplexExample')

const owner = web3.eth.accounts[1];
const contractName = 'Donations';
const tokenClass = 'MintableERC721Token';
const tokenName = 'DonationToken';
const tokenSymbol = 'DON';

async function setupApp(txParams) {

  // On-chain, single entry point of the entire application.
  log.info(`<< Setting up App >> network: ${network}`)
  const initialVersion = '0.0.1'
  return await AppDeployer.call(initialVersion, txParams)
}

async function deployVersion1(app) {

  // Register the first implementation of 'Donations', and request a proxy for it.
  log.info('<< Deploying version 1 >>')
  const DonationsV1 = ContractsProvider.getByName('DonationsV1')
  await app.setImplementation(DonationsV1, contractName);
  return await app.createProxy(DonationsV1, contractName, 'initialize', [owner])
}

async function deployVersion2(app, donations, txParams) {

  // Create a new version of the app, liked to the zeppelin_os standard library.
  // Register a new implementation for 'Donations' and upgrade it's proxy to use the new implementation.
  log.info('<< Deploying version 2 >>')
  const secondVersion = '0.0.2'
  await app.newVersion(secondVersion, await getStdLib(txParams))
  const DonationsV2 = ContractsProvider.getByName('DonationsV2')
  await app.setImplementation(DonationsV2, contractName);
  await app.upgradeProxy(donations.address, null, contractName)
  donations = DonationsV2.at(donations.address)

  // Add an ERC721 token implementation to the project, request a proxy for it,
  // and set the token on 'Donations'.
  log.info(`Creating ERC721 token proxy to use in ${contractName}...`)
  const token = await app.createProxy(
    MintableERC721Token, 
    tokenClass,
    'initialize',
    [donations.address, tokenName, tokenSymbol]
  )
  log.info(`Token proxy created at ${token.address}`)
  log.info('Setting application\'s token...')
  await donations.setToken(token.address, txParams)
  log.info('Token set succesfully')
  return token;
}

async function getStdLib(txParams) {

  // Use deployed standard library, or simulate one in local networks.
  if(!network || network === 'local') {
    const stdlib = await ImplementationDirectory.new(txParams);
    const tokenImplementation = await MintableERC721Token.new();
    await stdlib.setImplementation(tokenClass, tokenImplementation.address, txParams);
    return stdlib.address;
  }
  else if(network === 'ropsten') return '0xA739d10Cc20211B973dEE09DB8F0D75736E2D817';
}

module.exports = async function() {

  const txParams = {
    from: owner,
    gas: 3000000,
    gasPrice: 100000000000
  };
  const app = await setupApp(txParams);
  const donations = await deployVersion1(app);
  await deployVersion2(app, donations, txParams);
};

// Used in tests:
module.exports.setupApp = setupApp;
module.exports.deployVersion1 = deployVersion1;
module.exports.deployVersion2 = deployVersion2;
