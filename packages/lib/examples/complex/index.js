global.artifacts = artifacts;
global.ContractsProvider = require('zos-lib/src/utils/ContractsProvider').default;

const args = require('minimist')(process.argv.slice(2));
const network = args.network;

const ContractDirectory = artifacts.require('ContractDirectory');
const MintableERC721Token = artifacts.require('MintableERC721Token');
const { decodeLogs, Logger, AppManagerDeployer, ContractsProvider } = require('zos-lib')
const log = new Logger('ComplexExample')

const owner = web3.eth.accounts[1];
const contractName = "Donations";
const tokenClass = 'MintableERC721Token';
const tokenName = 'DonationToken';
const tokenSymbol = 'DON';

async function setupAppManager(txParams) {

  // On-chain, single entry point of the entire application.
  log.info(`<< Setting up AppManager >> network: ${network}`)
  const initialVersion = '0.0.1'
  return await AppManagerDeployer.call(initialVersion, txParams)
}

async function deployVersion1(appManager, txParams) {

  // Register the first implementation of "Donations", and request a proxy for it.
  log.info("<< Deploying version 1 >>")
  const DonationsV1 = ContractsProvider.getByName('DonationsV1')
  await appManager.setImplementation(DonationsV1, contractName);
  return await appManager.createProxy(DonationsV1, contractName, 'initialize', [owner])
}

async function deployVersion2(appManager, donations, txParams) {

  // Create a new version of the app, liked to the zeppelin_os standard library.
  // Register a new implementation for "Donations" and upgrade it's proxy to use the new implementation.
  log.info("<< Deploying version 2 >>")
  const secondVersion = '0.0.2'
  await appManager.newVersion(secondVersion, await getStdLib(txParams))
  const DonationsV2 = ContractsProvider.getByName('DonationsV2')
  await appManager.setImplementation(DonationsV2, contractName);
  await appManager.upgradeProxy(donations.address, null, contractName)
  donations = DonationsV2.at(donations.address)

  // Add an ERC721 token implementation to the project, request a proxy for it,
  // and set the token on "Donations".
  log.info(`Creating ERC721 token proxy to use in ${contractName}...`)
  const token = await appManager.createProxy(
    MintableERC721Token, 
    tokenClass,
    'initialize',
    [donations.address, tokenName, tokenSymbol]
  )
  log.info(`Token proxy created at ${token.address}`)
  log.info("Setting application's token...")
  await donations.setToken(token.address, txParams)
  log.info("Token set succesfully")
  return token;
}

async function getStdLib(txParams) {

  // Use deployed standard library, or simulate one in local networks.
  if(!network || network === 'development') {
    const stdlib = await ContractDirectory.new(txParams);
    const tokenImplementation = await MintableERC721Token.new();
    await stdlib.setImplementation(tokenClass, tokenImplementation.address, txParams);
    return stdlib.address;
  }
  else if(network === 'ropsten') return "0xA739d10Cc20211B973dEE09DB8F0D75736E2D817";
}

module.exports = async function() {

  const txParams = {
    from: owner,
    gas: 3000000,
    gasPrice: 100000000000
  };
  const appManager = await setupAppManager(txParams);
  const donations = await deployVersion1(appManager, txParams);
  await deployVersion2(appManager, donations, txParams);
};

// Used in tests:
module.exports.setupAppManager = setupAppManager;
module.exports.deployVersion1 = deployVersion1;
module.exports.deployVersion2 = deployVersion2;
