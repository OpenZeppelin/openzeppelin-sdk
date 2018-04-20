import AppManager from '../models/AppManager'
import makeContract from '../utils/contract'
import PackageFilesInterface from '../utils/PackageFilesInterface'

async function upgradeProxy(proxyAddress, contractAlias, { initArgs, network, from, packageFileName }) {
  if (proxyAddress === undefined) throw `Must provide a proxy address`
  if (contractAlias === undefined) throw `Must provide a contract name`

  // TODO: if network file does not exists, create it
  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = files.read()
  const zosNetworkFile = files.readNetworkFile(network)
  const { proxies } = zosNetworkFile

  const index = proxies[contractAlias].findIndex(proxy => proxy.address === proxyAddress)
  if (index === undefined) throw `Could not find a ${contractAlias} proxy with address ${proxyAddress}`

  const appManager = new AppManager(from)
  await appManager.connect(zosNetworkFile.app.address)

  const contractName = zosPackage.contracts[contractAlias]
  if (!contractName) throw `Could not find ${contractAlias} contract in zOS package file`

  const contractClass = makeContract(contractName)
  await appManager.upgradeProxy(proxyAddress, contractClass, contractAlias, 'initialize', initArgs)
  // TODO: Support more than one initialize function

  proxies[contractAlias][index].version = appManager.version
  zosNetworkFile.proxies = proxies
  files.writeNetworkFile(network, zosNetworkFile)
}

module.exports = upgradeProxy
