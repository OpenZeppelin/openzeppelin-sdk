import PackageFilesInterface from '../utils/PackageFilesInterface'
import AppManager from '../models/AppManager'


async function createProxy(contractName, { network, from, packageFileName }) {
  const files = new PackageFilesInterface(packageFileName)
  // TODO: if network file does not exists, create it
  const zosPackage = files.read()
  const zosNetworkFile = files.readNetworkFile(network)
  const { proxies } = zosNetworkFile

  const appManager = new AppManager(from)
  await appManager.connect(zosNetworkFile.app.address)

  const contractClass = artifacts.require(zosPackage.contracts[contractName])
  const proxyInstance = await appManager.createProxy(contractClass, contractName)

  const { address } = proxyInstance
  const { version } = appManager

  proxies[contractName] = proxies[contractName] || []
  proxies[contractName].push({ address, version })

  zosNetworkFile.proxies = proxies
  files.writeNetworkFile(network, zosNetworkFile)
}

module.exports = createProxy
