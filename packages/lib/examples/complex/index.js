const { decodeLogs, Logger, AppManagerDeployer, ContractsProvider } = require('zos-lib')
const log = new Logger('.')

const stdlib = "0xA739d10Cc20211B973dEE09DB8F0D75736E2D817";
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
  const appManager = AppManagerDeployer.call(initialVersion, txParams)

  // Register the first implementation of "Basil", and request a proxy for it.
  log.info("\n<< Deploying version 1 >>")
  const DonationsV1 = ContractsProvider.getByName('DonationsV1')
  await appManager.setImplementation(DonationsV1, contractName);
  await appManager.createProxy(DonationsV1, contractName, 'initialize', [owner])

  // Create a new version of the app, liked to the zeppelin_os standard library.
  // Register a new implementation for "Basil" and upgrade it's proxy to use the new implementation.
  log.info("\n<< Deploying version 2 >>")
  const secondVersion = '0.0.2'
  await appManager.newVersion(secondVersion, stdlib)
  const DonationsV2 = ContractsProvider.getByName('DonationsV2')
  await appManager.setImplementation(DonationsV2, contractName);
  const donations = await appManager.upgradeProxy(DonationsV1, contractName)

  // Add an ERC721 token implementation to the project, request a proxy for it,
  // and set the token on "Basil".
  log.info(`Creating ERC721 token proxy to use in ${contractName}...`)
  const {receipt} = await this.appManager.create('MintableERC721Token', txParams)
  const UpgradeabilityProxyFactory = ContractsProvider.getByName('UpgradeabilityProxyFactory')
  const logs = decodeLogs([receipt.logs[1]], UpgradeabilityProxyFactory)
  const proxyAddress = logs.find(l => l.event === 'ProxyCreated').args.proxy
  log.info(`Token proxy created at ${proxyAddress}`)
  log.info("Setting application's token...")
  await donations.setToken(proxyAddress, txParams)
  log.info("Token set succesfully")
}
