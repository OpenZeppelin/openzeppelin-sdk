require('babel-register')
require('babel-polyfill')

global.artifacts = artifacts;
global.ContractsProvider = require('../../src/utils/ContractsProvider').default;

const MintableERC721Token = artifacts.require('MintableERC721Token');
const { decodeLogs, Logger, AppManagerDeployer, ContractsProvider } = require('zos-lib')
const log = new Logger('ComplexExample')

const stdlib_ropsten = "0xA739d10Cc20211B973dEE09DB8F0D75736E2D817";
const owner = web3.eth.accounts[1];
const contractName = "Donations";
const txParams = {
  from: owner,
  gas: 2000000,
  gasPrice: 120000000000
};

module.exports = async function setupAppManager() {

  // On-chain, single entry point of the entire application.
  log.info("<< Setting up AppManager >>")
  const initialVersion = '0.0.1'
  const appManager = await AppManagerDeployer.call(initialVersion, txParams)

  // Register the first implementation of "Basil", and request a proxy for it.
  log.info("<< Deploying version 1 >>")
  const DonationsV1 = ContractsProvider.getByName('DonationsV1')
  await appManager.setImplementation(DonationsV1, contractName);
  let donations = await appManager.createProxy(DonationsV1, contractName, 'initialize', [owner])

  // Create a new version of the app, liked to the zeppelin_os standard library.
  // Register a new implementation for "Basil" and upgrade it's proxy to use the new implementation.
  log.info("<< Deploying version 2 >>")
  const secondVersion = '0.0.2'
  await appManager.newVersion(secondVersion, stdlib_ropsten)
  const DonationsV2 = ContractsProvider.getByName('DonationsV2')
  await appManager.setImplementation(DonationsV2, contractName);
  await appManager.upgradeProxy(donations.address, DonationsV1, contractName)
  donations = DonationsV2.at(donations.address);

  // Add an ERC721 token implementation to the project, request a proxy for it,
  // and set the token on "Basil".
  log.info(`Creating ERC721 token proxy to use in ${contractName}...`)
  const token = await appManager.createProxy(
    MintableERC721Token, 
    'MintableERC721Token', 
    'initialize'
    [donations.address, 'BasilToken', 'BSL']
  )
  log.info(`Token proxy created at ${token.address}`)
  log.info("Setting application's token...")
  await donations.setToken(token.address, txParams)
  log.info("Token set succesfully")
}
