import PackageFilesInterface from '../utils/PackageFilesInterface'
import { AppManager } from './models/AppManager'


async function createProxy(contractName, { network, from, packageFileName }) {
  const files = new PackageFilesInterface(packageFileName)
  // TODO: if network file does not exists, create it
  const zosNetworkFile = files.readNetworkFile(network)
  const { proxies } = zosNetworkFile

  const contractClass = artifacts.require(contractName)
  const proxyInstance = await AppManager.createProxy(contractClass, contractName, args)

  const { address } = proxyInstance
  const version = proxyInstance.version()

  proxies[contractName] = proxies[contractName] || []
  proxies[contractName].push({ address, version })

  zosNetworkFile.proxies = proxies
  files.writeNetworkFile(network, zosNetworkFile)
}

export default createProxy