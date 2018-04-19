import PackageFilesInterface from '../utils/PackageFilesInterface'
import AppManager from '../models/AppManager'


async function createProxy(contractName, { network, from, packageFileName }) {
  const files = new PackageFilesInterface(packageFileName)
  // TODO: if network file does not exists, create it
  const zosPackage = files.read()
  const zosNetworkFile = files.readNetworkFile(network)
  const { proxies } = zosNetworkFile

  const appManager = new AppManager(from)
  appManager.connect(zosNetworkFile.app.address)

  const contractClass = artifacts.require(zosPackage.contracts[contractName])
  const proxyInstance = await appManager.createProxy(contractClass, contractName, args)

  const { address } = proxyInstance
  const version = proxyInstance.version()

  proxies[contractName] = proxies[contractName] || []
  proxies[contractName].push({ address, version })

  zosNetworkFile.proxies = proxies
  files.writeNetworkFile(network, zosNetworkFile)
}

module.exports = createProxy
